import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePrescriptionPDF } from "@/lib/pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

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
      prescriptions: true,
    },
  });

  if (!encounter) {
    return new NextResponse("Prescription / Encounter not found", { status: 404 });
  }

  // Authorization check
  if (session.user.role === "PATIENT" && encounter.patient.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Calculate age
  const birthYear = encounter.patient.dateOfBirth.getFullYear();
  const currentYear = new Date().getFullYear();
  const age = `${currentYear - birthYear} Yrs`;

  const pdfBytes = await generatePrescriptionPDF({
    hospitalName: process.env.NEXT_PUBLIC_APP_NAME || "MediCloud Hospital",
    doctorName: encounter.doctor.user.name,
    doctorSpecialization: encounter.doctor.specialization,
    department: encounter.doctor.department.name,
    patientName: encounter.patient.name,
    patientAge: age,
    patientGender: encounter.patient.gender,
    date: encounter.createdAt.toLocaleDateString("en-IN"),
    symptoms: encounter.symptoms,
    diagnosis: encounter.diagnosis,
    vitals: (encounter.vitals as Record<string, string>) || {},
    prescriptions: encounter.prescriptions,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prescription_${encounter.id}.pdf"`,
    },
  });
}
