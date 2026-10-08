import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { BookingFormClient } from "./BookingFormClient";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { patientId } = await searchParams;

  // If user is patient, load their patient record
  let currentPatient = null;
  if (session.user.role === "PATIENT") {
    currentPatient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });
  }

  // Pre-selected patient if provided in query (for staff)
  let preselectedPatient = null;
  if (patientId) {
    preselectedPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
  }

  // All active departments and doctors
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  const doctors = await prisma.doctorProfile.findMany({
    where: { user: { isActive: true } },
    include: { user: true, department: true },
  });

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Book OPD Consultation
          </h1>
          <p className="text-sm text-slate-500">
            Select specialty, clinician, and an available time slot
          </p>
        </div>

        <BookingFormClient
          departments={departments}
          doctors={doctors}
          currentPatient={currentPatient}
          preselectedPatient={preselectedPatient}
          userRole={session.user.role}
        />
      </div>
    </Shell>
  );
}
