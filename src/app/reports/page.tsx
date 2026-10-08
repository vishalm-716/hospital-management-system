import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileText, Upload, Eye, ShieldCheck, User } from "lucide-react";
import { ReportsListClient } from "./ReportsListClient";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const where: Record<string, unknown> = {};

  if (session.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!patient) return null;
    where.patientId = patient.id;
  }

  const reports = await prisma.medicalReport.findMany({
    where,
    include: {
      patient: true,
      uploadedBy: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Private Medical Reports
            </h1>
            <p className="text-sm text-slate-500">
              Encrypted Supabase Cloud Storage with short-lived signed URL retrieval
            </p>
          </div>
        </div>

        <ReportsListClient reports={reports} userRole={session.user.role} />
      </div>
    </Shell>
  );
}
