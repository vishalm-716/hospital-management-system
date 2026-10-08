"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatTime, formatDate, getStatusColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Download,
  Filter,
} from "lucide-react";
import { updateAppointmentStatusAction } from "@/app/actions/appointments";

interface AppointmentListClientProps {
  appointments: any[];
  doctors: any[];
  userRole: string;
}

export function AppointmentListClient({
  appointments,
  doctors,
  userRole,
}: AppointmentListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDoctor, setSelectedDoctor] = useState(searchParams.get("doctorId") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (selectedDoctor) params.set("doctorId", selectedDoctor);
    if (selectedStatus) params.set("status", selectedStatus);
    router.push(`/appointments?${params.toString()}`);
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await updateAppointmentStatusAction(id, newStatus);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64">
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
              >
                <option value="">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.user.name} ({doc.department.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="CHECKED_IN">CHECKED_IN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <Button size="sm" onClick={handleFilter} className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-9">
              <Filter className="h-3.5 w-3.5 mr-1" /> Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            All Appointments ({appointments.length})
          </CardTitle>
          <CardDescription>
            Showing consultations matching applied filter parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No appointments found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor & Department</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                        {formatDate(appt.startsAt)}
                        <span className="block text-slate-400 font-normal">
                          {formatTime(appt.startsAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/patients/${appt.patient.id}`}
                          className="font-medium text-teal-700 hover:underline text-xs"
                        >
                          {appt.patient.name}
                        </Link>
                        <span className="block text-[11px] text-slate-400">
                          {appt.patient.mrn}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <p className="font-medium text-slate-800">
                          Dr. {appt.doctor.user.name}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {appt.department.name}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {appt.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {appt.status === "SCHEDULED" && (userRole === "RECEPTIONIST" || userRole === "ADMIN") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(appt.id, "CHECKED_IN")}
                            className="h-7 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                          >
                            Check In
                          </Button>
                        )}

                        {appt.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(appt.id, "CANCELLED")}
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Cancel
                          </Button>
                        )}

                        {appt.encounter && (
                          <a
                            href={`/api/prescriptions/${appt.encounter.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-200">
                              <Download className="h-3 w-3 mr-1" /> Rx
                            </Button>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
