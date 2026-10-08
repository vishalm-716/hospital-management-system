import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAppointments } from "@/app/actions/appointments";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";
import { Calendar, Plus, Clock, User, Stethoscope, Filter } from "lucide-react";
import { AppointmentListClient } from "./AppointmentListClient";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string; status?: string; date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const filters = await searchParams;
  const appointments = await getAppointments(filters);

  // Doctors for filter dropdown
  const doctors = await prisma.doctorProfile.findMany({
    where: { user: { isActive: true } },
    include: { user: true, department: true },
  });

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Appointments & Schedule
            </h1>
            <p className="text-sm text-slate-500">
              Manage clinical consultation slots, statuses, and bookings
            </p>
          </div>
          <Link href="/appointments/new">
            <Button className="bg-teal-600 hover:bg-teal-500 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Book New Appointment
            </Button>
          </Link>
        </div>

        {/* Client Appointments List with Status Flow & Filters */}
        <AppointmentListClient
          appointments={appointments}
          doctors={doctors}
          userRole={session.user.role}
        />
      </div>
    </Shell>
  );
}
