import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime, formatDate, getStatusColor } from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Sparkles,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { DoctorQueueClient } from "./DoctorQueueClient";

export default async function DoctorDashboard() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  // Find doctor's profile
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    include: { department: true },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Today's appointments for this doctor (or all if admin viewing)
  const whereAppt: Record<string, unknown> = {
    startsAt: { gte: todayStart, lte: todayEnd },
  };
  if (doctorProfile) {
    whereAppt.doctorId = doctorProfile.id;
  }

  const appointments = await prisma.appointment.findMany({
    where: whereAppt,
    include: {
      patient: true,
      encounter: {
        include: { prescriptions: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const checkedInCount = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const inProgressCount = appointments.filter((a) => a.status === "IN_PROGRESS").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <Shell userRole="DOCTOR" userName={session.user.name}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Doctor Clinical Station
            </h1>
            <p className="text-sm text-slate-500">
              {doctorProfile?.specialization || "Clinical Specialist"} • {doctorProfile?.department?.name || "OPD"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/appointments">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                Full Schedule
              </Button>
            </Link>
          </div>
        </div>

        {/* Triage Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-amber-100 bg-amber-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Waiting / Checked In
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{checkedInCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                  In Consultation
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{inProgressCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Stethoscope className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Completed Today
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{completedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Today's Queue with Action Buttons */}
        <DoctorQueueClient appointments={appointments} />
      </div>
    </Shell>
  );
}
