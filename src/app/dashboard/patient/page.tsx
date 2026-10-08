import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, formatCurrency, getStatusColor } from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  FileText,
  CreditCard,
  Download,
  Plus,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
} from "lucide-react";
import { PatientPortalClient } from "./PatientPortalClient";

export default async function PatientDashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Find linked patient profile
  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      appointments: {
        include: {
          doctor: { include: { user: true, department: true } },
          department: true,
          encounter: {
            include: { prescriptions: true },
          },
        },
        orderBy: { startsAt: "desc" },
      },
      reports: {
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!patient) {
    return (
      <Shell userRole="PATIENT" userName={session.user.name}>
        <div className="py-12 text-center">
          <p className="text-slate-600">Patient profile not yet linked to your account.</p>
        </div>
      </Shell>
    );
  }

  const now = new Date();
  const upcomingAppointments = patient.appointments.filter(
    (a) => new Date(a.startsAt) >= now && a.status !== "CANCELLED"
  );
  const pastAppointments = patient.appointments.filter(
    (a) => new Date(a.startsAt) < now || a.status === "COMPLETED" || a.status === "CANCELLED"
  );

  return (
    <Shell userRole="PATIENT" userName={patient.name}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome, {patient.name}
            </h1>
            <p className="text-sm text-slate-500">
              Medical Record Number:{" "}
              <span className="font-mono font-semibold text-teal-700">{patient.mrn}</span>
            </p>
          </div>
          <Link href="/appointments/new">
            <Button className="bg-teal-600 hover:bg-teal-500 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-1" />
              Book New Appointment
            </Button>
          </Link>
        </div>

        {/* Patient Clinical Profile Snapshot */}
        <Card className="bg-gradient-to-r from-teal-500/10 via-white to-blue-50/20 border-teal-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Date of Birth</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDate(patient.dateOfBirth)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Blood Group</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {patient.bloodGroup || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Known Allergies</p>
                <p className="text-sm font-semibold text-rose-700 mt-0.5">
                  {patient.allergies || "None reported"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Emergency Contact</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {patient.emergencyContact || "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Client Section: Appointments, Prescriptions, Reports, Invoices */}
        <PatientPortalClient
          patient={patient}
          upcomingAppointments={upcomingAppointments}
          pastAppointments={pastAppointments}
          reports={patient.reports}
          invoices={patient.invoices}
        />
      </div>
    </Shell>
  );
}
