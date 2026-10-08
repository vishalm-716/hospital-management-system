"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { patientSchema } from "@/lib/validations";
import { generateMRN } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getPatients(query?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Record audit log for patient list access
  await createAuditLog({
    userId: session.user.id,
    action: "READ_PATIENT_LIST",
    entity: "Patient",
    metadata: { query: query || null },
  });

  if (!query || query.trim() === "") {
    return prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        appointments: {
          take: 1,
          orderBy: { startsAt: "desc" },
        },
      },
    });
  }

  const cleanQuery = query.trim();
  return prisma.patient.findMany({
    where: {
      OR: [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { mrn: { contains: cleanQuery, mode: "insensitive" } },
        { phone: { contains: cleanQuery, mode: "insensitive" } },
        { email: { contains: cleanQuery, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      appointments: {
        take: 1,
        orderBy: { startsAt: "desc" },
      },
    },
  });
}

export async function getPatientById(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Role check: Patient can only view their own record unless ADMIN/DOCTOR/RECEPTIONIST
  if (session.user.role === "PATIENT") {
    const patientUser = await prisma.patient.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (patientUser?.userId !== session.user.id) {
      throw new Error("Forbidden: You can only view your own patient profile");
    }
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: true,
      appointments: {
        include: {
          doctor: { include: { user: true } },
          department: true,
          encounter: {
            include: {
              prescriptions: true,
            },
          },
        },
        orderBy: { startsAt: "desc" },
      },
      encounters: {
        include: {
          doctor: { include: { user: true } },
          prescriptions: true,
          appointment: true,
        },
        orderBy: { createdAt: "desc" },
      },
      reports: {
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      beds: true,
    },
  });

  if (patient) {
    await createAuditLog({
      userId: session.user.id,
      action: "READ_PATIENT_DETAILS",
      entity: "Patient",
      entityId: patient.id,
      metadata: { mrn: patient.mrn },
    });
  }

  return patient;
}

export async function createPatientAction(
  _prevState: { error?: string; success?: boolean; patientId?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (session.user.role === "PATIENT") {
    return { error: "Forbidden: Patients cannot register other patients" };
  }

  const rawData = {
    name: formData.get("name") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    gender: formData.get("gender") as "MALE" | "FEMALE" | "OTHER",
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || undefined,
    bloodGroup: (formData.get("bloodGroup") as string) || undefined,
    allergies: (formData.get("allergies") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    emergencyContact: (formData.get("emergencyContact") as string) || undefined,
  };

  const parsed = patientSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const mrn = generateMRN();
    const patient = await prisma.patient.create({
      data: {
        mrn,
        name: parsed.data.name,
        dateOfBirth: new Date(parsed.data.dateOfBirth),
        gender: parsed.data.gender,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        bloodGroup: parsed.data.bloodGroup || null,
        allergies: parsed.data.allergies || null,
        address: parsed.data.address || null,
        emergencyContact: parsed.data.emergencyContact || null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE_PATIENT",
      entity: "Patient",
      entityId: patient.id,
      metadata: { mrn: patient.mrn, name: patient.name },
    });

    revalidatePath("/patients");
    revalidatePath("/dashboard/reception");
    return { success: true, patientId: patient.id };
  } catch (err) {
    console.error("Create patient error:", err);
    return { error: "Failed to create patient. Please check the inputs." };
  }
}
