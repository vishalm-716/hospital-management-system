"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encounterSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createEncounterAction(
  _prevState: { error?: string; success?: boolean; encounterId?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
    return { error: "Only doctors may record clinical encounters" };
  }

  // Parse raw JSON prescriptions if provided
  let prescriptionsData: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions?: string;
  }> = [];

  const rawPrescriptions = formData.get("prescriptions") as string;
  if (rawPrescriptions) {
    try {
      prescriptionsData = JSON.parse(rawPrescriptions);
    } catch {
      // ignore or handle
    }
  }

  const rawVitals = {
    bp: (formData.get("vitals_bp") as string) || undefined,
    pulse: (formData.get("vitals_pulse") as string) || undefined,
    temp: (formData.get("vitals_temp") as string) || undefined,
    spo2: (formData.get("vitals_spo2") as string) || undefined,
    weight: (formData.get("vitals_weight") as string) || undefined,
    height: (formData.get("vitals_height") as string) || undefined,
  };

  const rawData = {
    appointmentId: formData.get("appointmentId") as string,
    symptoms: formData.get("symptoms") as string,
    diagnosis: formData.get("diagnosis") as string,
    notes: (formData.get("notes") as string) || undefined,
    vitals: rawVitals,
    prescriptions: prescriptionsData,
  };

  const parsed = encounterSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Validation failed" };
  }

  try {
    // Validate appointment exists and matches doctor
    const appt = await prisma.appointment.findUnique({
      where: { id: parsed.data.appointmentId },
      include: { doctor: true },
    });

    if (!appt) {
      return { error: "Valid appointment required to initiate an encounter." };
    }

    // Use transaction to create encounter and prescriptions, and mark appointment COMPLETED
    const encounter = await prisma.$transaction(async (tx) => {
      const enc = await tx.encounter.create({
        data: {
          appointmentId: appt.id,
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          symptoms: parsed.data.symptoms,
          diagnosis: parsed.data.diagnosis,
          notes: parsed.data.notes || null,
          vitals: parsed.data.vitals || {},
          prescriptions: {
            create: (parsed.data.prescriptions || []).map((p) => ({
              medicine: p.medicine,
              dosage: p.dosage,
              frequency: p.frequency,
              durationDays: p.durationDays,
              instructions: p.instructions || null,
            })),
          },
        },
        include: { prescriptions: true },
      });

      // Update appointment status to COMPLETED
      await tx.appointment.update({
        where: { id: appt.id },
        data: { status: "COMPLETED" },
      });

      return enc;
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE_ENCOUNTER",
      entity: "Encounter",
      entityId: encounter.id,
      metadata: {
        appointmentId: appt.id,
        patientId: appt.patientId,
        prescriptionsCount: encounter.prescriptions.length,
      },
    });

    revalidatePath(`/encounters/${encounter.id}`);
    revalidatePath(`/patients/${appt.patientId}`);
    revalidatePath("/appointments");
    revalidatePath("/dashboard/doctor");
    return { success: true, encounterId: encounter.id };
  } catch (err) {
    console.error("Create encounter error:", err);
    return { error: "Failed to record encounter" };
  }
}

export async function getEncounterById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const encounter = await prisma.encounter.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: {
        include: {
          user: true,
          department: true,
        },
      },
      appointment: true,
      prescriptions: true,
    },
  });

  if (!encounter) return null;

  // Authorization check
  if (session.user.role === "PATIENT") {
    if (encounter.patient.userId !== session.user.id) {
      throw new Error("Forbidden");
    }
  }

  await createAuditLog({
    userId: session.user.id,
    action: "READ_ENCOUNTER",
    entity: "Encounter",
    entityId: encounter.id,
  });

  return encounter;
}
