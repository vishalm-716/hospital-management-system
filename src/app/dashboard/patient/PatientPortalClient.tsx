"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTime, formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Download,
  FileText,
  CreditCard,
  XCircle,
  Eye,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import { updateAppointmentStatusAction } from "@/app/actions/appointments";
import { getReportSignedUrlAction } from "@/app/actions/reports";

interface PatientPortalClientProps {
  patient: any;
  upcomingAppointments: any[];
  pastAppointments: any[];
  reports: any[];
  invoices: any[];
}

export function PatientPortalClient({
  patient,
  upcomingAppointments,
  pastAppointments,
  reports,
  invoices,
}: PatientPortalClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"appointments" | "history" | "reports" | "billing">(
    "appointments"
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await updateAppointmentStatusAction(id, "CANCELLED");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const res = await getReportSignedUrlAction(reportId);
      if (res?.url) {
        window.open(res.url, "_blank");
      }
    } catch (err) {
      alert("Could not load signed report URL: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "appointments"
              ? "border-teal-600 text-teal-800 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Appointments ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-teal-600 text-teal-800 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Prescriptions & Clinical History
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "reports"
              ? "border-teal-600 text-teal-800 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Lab & Radiology Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "billing"
              ? "border-teal-600 text-teal-800 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Billing & Receipts ({invoices.length})
        </button>
      </div>

      {/* Tab 1: Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Upcoming Scheduled Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No upcoming appointments.{" "}
                  <Link href="/appointments/new" className="text-teal-600 underline font-medium">
                    Schedule a consultation
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingAppointments.map((appt) => (
                    <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            Dr. {appt.doctor.user.name}
                          </span>
                          <Badge variant="outline">{appt.department.name}</Badge>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(appt.status)}`}>
                            {appt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          📅 {formatDate(appt.startsAt)} at {formatTime(appt.startsAt)}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">Reason: {appt.reason}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {appt.status === "SCHEDULED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancellingId === appt.id}
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {cancellingId === appt.id ? "Cancelling..." : "Cancel Visit"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-700">Past Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {pastAppointments.map((appt) => (
                    <div key={appt.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-slate-800">
                          Dr. {appt.doctor.user.name} ({appt.department.name})
                        </p>
                        <p className="text-slate-500">
                          {formatDate(appt.startsAt)} • {appt.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                        {appt.encounter && (
                          <a
                            href={`/api/prescriptions/${appt.encounter.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-700">
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Rx PDF
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: History & Prescriptions */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Prescriptions & Clinical Encounters</CardTitle>
            <CardDescription>Official medical consultations and prescribed drug regimens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.appointments.filter((a: any) => a.encounter).length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">No recorded prescriptions yet.</p>
              ) : (
                patient.appointments
                  .filter((a: any) => a.encounter)
                  .map((appt: any) => (
                    <div key={appt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Dr. {appt.doctor.user.name} — {appt.department.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Diagnosis: <strong>{appt.encounter.diagnosis}</strong> • {formatDate(appt.startsAt)}
                          </p>
                        </div>
                        <a
                          href={`/api/prescriptions/${appt.encounter.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download Prescription PDF
                          </Button>
                        </a>
                      </div>

                      {/* Rx list */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <p className="font-semibold text-slate-700">Prescribed Medications:</p>
                        {appt.encounter.prescriptions.map((rx: any) => (
                          <div key={rx.id} className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                            <span>
                              💊 <strong>{rx.medicine}</strong> ({rx.dosage})
                            </span>
                            <span>{rx.frequency} • {rx.durationDays} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Diagnostic Reports */}
      {activeTab === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Diagnostic & Laboratory Reports</CardTitle>
            <CardDescription>Secure, encrypted medical attachments with authorized signed access</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">No diagnostic reports uploaded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <div key={rep.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{rep.title}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(rep.createdAt)} • {(rep.fileSize / 1024).toFixed(0)} KB • {rep.mimeType}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewReport(rep.id)}
                      className="text-teal-700 border-teal-200 hover:bg-teal-50 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Signed Document
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Invoices */}
      {activeTab === "billing" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tax Invoices & Payment Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">No invoices on record.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 font-mono text-xs">
                          {inv.invoiceNo}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Date: {formatDate(inv.createdAt)} • Total:{" "}
                        <strong className="text-slate-800">{formatCurrency(inv.total)}</strong>
                      </p>
                    </div>
                    <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="text-xs text-emerald-700 border-emerald-200">
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download Invoice PDF
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
