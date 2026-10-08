"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getAppointments(filters?: {
  doctorId?: string;
  patientId?: string;
  status?: string;
  date?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {};

  // If patient, restrict to their appointments
  if (session.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!patient) return [];
    where.patientId = patient.id;
  } else if (session.user.role === "DOCTOR") {
    // If doctor, default to their profile unless specified
    const docProfile = await prisma.doctorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (docProfile) {
      where.doctorId = docProfile.id;
    }
  }

  if (filters?.doctorId) where.doctorId = filters.doctorId;
  if (filters?.patientId && session.user.role !== "PATIENT") where.patientId = filters.patientId;
  if (filters?.status) where.status = filters.status;

  if (filters?.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    where.startsAt = { gte: start, lte: end };
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      doctor: {
        include: {
          user: true,
          department: true,
        },
      },
      department: true,
      encounter: true,
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function getAvailableSlots(doctorId: string, dateStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: { user: true },
  });

  if (!doctor || !doctor.user.isActive) {
    return [];
  }

  const selectedDate = new Date(dateStr);
  const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  if (!doctor.workingDays.includes(dayName)) {
    return [];
  }

  // Parse start and end hours
  const [startHour, startMin] = doctor.startTime.split(":").map(Number);
  const [endHour, endMin] = doctor.endTime.split(":").map(Number);
  const slotMinutes = doctor.slotMinutes || 30;

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Existing active appointments for doctor on this day
  const existingAppts = await prisma.appointment.findMany({
    where: {
      doctorId,
      startsAt: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { startsAt: true },
  });

  const bookedTimestamps = new Set(
    existingAppts.map((a) => a.startsAt.getTime())
  );

  const slots: { time: string; startsAt: string; available: boolean }[] = [];
  const currentSlot = new Date(selectedDate);
  currentSlot.setHours(startHour, startMin, 0, 0);

  const endLimit = new Date(selectedDate);
  endLimit.setHours(endHour, endMin, 0, 0);

  const now = new Date();

  while (currentSlot < endLimit) {
    const isPast = currentSlot < now;
    const isBooked = bookedTimestamps.has(currentSlot.getTime());

    const timeStr = currentSlot.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    slots.push({
      time: timeStr,
      startsAt: currentSlot.toISOString(),
      available: !isPast && !isBooked,
    });

    currentSlot.setMinutes(currentSlot.getMinutes() + slotMinutes);
  }

  return slots;
}

export async function createAppointmentAction(
  _prevState: { error?: string; success?: boolean; appointmentId?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const rawData = {
    patientId: formData.get("patientId") as string,
    doctorId: formData.get("doctorId") as string,
    departmentId: formData.get("departmentId") as string,
    date: formData.get("date") as string,
    time: formData.get("time") as string,
    reason: formData.get("reason") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = appointmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const startsAt = new Date(parsed.data.time);
    const now = new Date();

    if (startsAt < now) {
      return { error: "Cannot book an appointment in the past." };
    }

    // Role check: If patient, enforce that patientId matches their own profile
    if (session.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { userId: session.user.id },
      });
      if (!patient || patient.id !== parsed.data.patientId) {
        return { error: "Unauthorized patient profile access" };
      }
    }

    // Check doctor is active
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: parsed.data.doctorId },
      include: { user: true },
    });
    if (!doctor || !doctor.user.isActive) {
      return { error: "Selected doctor is not currently active." };
    }

    const slotMinutes = doctor.slotMinutes || 30;
    const endsAt = new Date(startsAt.getTime() + slotMinutes * 60000);

    // Run in a transaction to prevent double-booking race condition
    const appt = await prisma.$transaction(async (tx) => {
      // Check existing non-cancelled appointment at this time
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId: parsed.data.doctorId,
          startsAt,
          status: { notIn: ["CANCELLED"] },
        },
      });

      if (existing) {
        throw new Error("This doctor slot is already booked. Please choose another time.");
      }

      return tx.appointment.create({
        data: {
          patientId: parsed.data.patientId,
          doctorId: parsed.data.doctorId,
          departmentId: parsed.data.departmentId,
          startsAt,
          endsAt,
          status: "SCHEDULED",
          reason: parsed.data.reason,
          notes: parsed.data.notes || null,
        },
      });
    });

    await createAuditLog({
      userId: session.user.id,
      action: "BOOK_APPOINTMENT",
      entity: "Appointment",
      entityId: appt.id,
      metadata: { doctorId: appt.doctorId, patientId: appt.patientId, startsAt },
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    return { success: true, appointmentId: appt.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to book appointment";
    return { error: msg };
  }
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true },
  });

  if (!appt) throw new Error("Appointment not found");

  // Patient business rule: Cannot cancel a completed appointment
  if (session.user.role === "PATIENT") {
    if (appt.patient.userId !== session.user.id) {
      throw new Error("Unauthorized access");
    }
    if (newStatus !== "CANCELLED") {
      throw new Error("Patients may only cancel appointments");
    }
    if (appt.status === "COMPLETED") {
      throw new Error("Cannot cancel an already completed appointment");
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: newStatus },
  });

  await createAuditLog({
    userId: session.user.id,
    action: `APPOINTMENT_STATUS_${newStatus}`,
    entity: "Appointment",
    entityId: updated.id,
    metadata: { previousStatus: appt.status, newStatus },
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return updated;
}
