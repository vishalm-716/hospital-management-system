"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { uploadMedicalReport, getSignedReportUrl } from "@/lib/supabase";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function uploadReportAction(
  _prevState: { error?: string; success?: boolean; reportId?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR") {
    return { error: "Only doctors or administrators can upload medical reports" };
  }

  const patientId = formData.get("patientId") as string;
  const title = formData.get("title") as string;
  const file = formData.get("file") as File;

  if (!patientId || !title || !file) {
    return { error: "Patient, title, and document file are required" };
  }

  // File validation
  const allowedMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  if (!allowedMimes.includes(file.type)) {
    return { error: "Invalid file type. Only PDF, PNG, and JPG files are accepted." };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { error: "File exceeds maximum permitted size of 10MB" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Safe generated storage path
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storagePath = `patient_${patientId}/${safeFilename}`;

    // Upload using Supabase service-role (server-only)
    const uploadRes = await uploadMedicalReport(storagePath, buffer, file.type);
    if (uploadRes.error) {
      return { error: `Storage upload failed: ${uploadRes.error}` };
    }

    // Record metadata in database
    const report = await prisma.medicalReport.create({
      data: {
        patientId,
        uploadedById: session.user.id,
        title,
        storagePath: uploadRes.path,
        mimeType: file.type,
        fileSize: file.size,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPLOAD_MEDICAL_REPORT",
      entity: "MedicalReport",
      entityId: report.id,
      metadata: {
        patientId,
        title,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    revalidatePath("/reports");
    revalidatePath(`/patients/${patientId}`);
    return { success: true, reportId: report.id };
  } catch (err) {
    console.error("Report upload error:", err);
    return { error: "Failed to upload medical report" };
  }
}

export async function getReportSignedUrlAction(reportId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const report = await prisma.medicalReport.findUnique({
    where: { id: reportId },
    include: { patient: true },
  });

  if (!report) throw new Error("Report not found");

  // Authorization check
  if (session.user.role === "PATIENT") {
    if (report.patient.userId !== session.user.id) {
      throw new Error("Forbidden: You cannot access other patients' medical reports");
    }
  }

  // Generate 5-minute signed URL
  const { url, error } = await getSignedReportUrl(report.storagePath, 300);
  if (error || !url) {
    throw new Error(error || "Could not generate download link");
  }

  await createAuditLog({
    userId: session.user.id,
    action: "ACCESS_SIGNED_REPORT_URL",
    entity: "MedicalReport",
    entityId: report.id,
    metadata: { title: report.title },
  });

  return { url };
}
