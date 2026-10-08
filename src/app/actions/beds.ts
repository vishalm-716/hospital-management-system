"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bedAssignSchema, bedStatusSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getBeds() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.bed.findMany({
    include: { patient: true },
    orderBy: [{ ward: "asc" }, { number: "asc" }],
  });
}

export async function assignBedAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
    return { error: "Forbidden: Only Admin or Receptionist can assign beds" };
  }

  const rawData = {
    bedId: formData.get("bedId") as string,
    patientId: formData.get("patientId") as string,
  };

  const parsed = bedAssignSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const bed = await tx.bed.findUnique({ where: { id: parsed.data.bedId } });
      if (!bed) throw new Error("Bed not found");

      // Business rule: Prevent assigning an already occupied bed
      if (bed.status === "OCCUPIED") {
        throw new Error("Bed is already occupied by another patient");
      }
      if (bed.status === "MAINTENANCE") {
        throw new Error("Bed is currently under maintenance");
      }

      return tx.bed.update({
        where: { id: parsed.data.bedId },
        data: {
          status: "OCCUPIED",
          patientId: parsed.data.patientId,
          assignedAt: new Date(),
        },
      });
    });

    await createAuditLog({
      userId: session.user.id,
      action: "ASSIGN_BED",
      entity: "Bed",
      entityId: updated.id,
      metadata: {
        ward: updated.ward,
        number: updated.number,
        patientId: parsed.data.patientId,
      },
    });

    revalidatePath("/beds");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to assign bed";
    return { error: msg };
  }
}

export async function dischargeBedAction(bedId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
    throw new Error("Forbidden");
  }

  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed) throw new Error("Bed not found");

  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: {
      status: "AVAILABLE",
      patientId: null,
      assignedAt: null,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DISCHARGE_BED",
    entity: "Bed",
    entityId: updated.id,
    metadata: {
      ward: updated.ward,
      number: updated.number,
      previousPatientId: bed.patientId,
    },
  });

  revalidatePath("/beds");
  revalidatePath("/dashboard");
  return updated;
}

export async function setBedStatusAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (session.user.role !== "ADMIN") {
    return { error: "Only administrators can change maintenance status" };
  }

  const rawData = {
    bedId: formData.get("bedId") as string,
    status: formData.get("status") as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE",
  };

  const parsed = bedStatusSchema.safeParse(rawData);
  if (!parsed.success) return { error: "Invalid status" };

  try {
    const bed = await prisma.bed.update({
      where: { id: parsed.data.bedId },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === "MAINTENANCE" ? { patientId: null, assignedAt: null } : {}),
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE_BED_STATUS",
      entity: "Bed",
      entityId: bed.id,
      metadata: { status: bed.status },
    });

    revalidatePath("/beds");
    return { success: true };
  } catch {
    return { error: "Failed to update bed status" };
  }
}
