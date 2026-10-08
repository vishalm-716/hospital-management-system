import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  CreditCard,
  UserPlus,
  Search,
  Sparkles,
  Clock,
  CheckCircle,
} from "lucide-react";
import { ReceptionDeskClient } from "./ReceptionDeskClient";

export default async function ReceptionDashboard() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")
  ) {
    redirect("/dashboard");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Today's appointments for reception front desk
  const appointments = await prisma.appointment.findMany({
    where: { startsAt: { gte: todayStart, lte: todayEnd } },
    include: {
      patient: true,
      doctor: { include: { user: true, department: true } },
      department: true,
      invoices: true,
    },
    orderBy: { startsAt: "asc" },
  });

  // Active doctors for appointment booking
  const doctors = await prisma.doctorProfile.findMany({
    where: { user: { isActive: true } },
    include: { user: true, department: true },
  });

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  // Total patients count
  const totalPatients = await prisma.patient.count();
  const scheduledToday = appointments.filter((a) => a.status === "SCHEDULED").length;
  const checkedInToday = appointments.filter((a) => a.status === "CHECKED_IN").length;

  return (
    <Shell userRole="RECEPTIONIST" userName={session.user.name}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Front Desk & Patient Admissions
            </h1>
            <p className="text-sm text-slate-500">
              Patient check-ins, OPD queue management, and billing registry
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/appointments/new">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white">
                <Calendar className="h-4 w-4 mr-1" />
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="border-blue-100 bg-blue-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Scheduled Today
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{scheduledToday}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Checked-In / In Waiting Room
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{checkedInToday}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-100 bg-teal-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  Total Hospital Patients
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalPatients}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Reception Desk Client */}
        <ReceptionDeskClient
          appointments={appointments}
          doctors={doctors}
          departments={departments}
        />
      </div>
    </Shell>
  );
}
