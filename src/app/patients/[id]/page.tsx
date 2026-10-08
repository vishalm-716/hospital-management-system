import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPatientById } from "@/app/actions/patients";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, formatCurrency, getStatusColor } from "@/lib/utils";
import {
  User,
  Calendar,
  FileText,
  CreditCard,
  Download,
  Plus,
  Sparkles,
  Upload,
  HeartPulse,
  Clock,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { PatientDetailActions } from "./PatientDetailActions";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  let patient;
  try {
    patient = await getPatientById(id);
  } catch {
    redirect("/patients");
  }

  if (!patient) notFound();

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="space-y-6">
        {/* Back Link & Header */}
        <div>
          <Link
            href="/patients"
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Patient Registry
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {patient.name}
              </h1>
              <p className="text-sm text-slate-500">
                MRN: <span className="font-mono font-semibold text-teal-800">{patient.mrn}</span> • Registered on {formatDate(patient.createdAt)}
              </p>
            </div>

            {/* Quick Actions for Clinicians / Staff */}
            <PatientDetailActions
              patientId={patient.id}
              patientName={patient.name}
              userRole={session.user.role}
            />
          </div>
        </div>

        {/* Demographic & Medical Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Clinical Demographic Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Date of Birth</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {formatDate(patient.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Gender</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {patient.gender}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Phone</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {patient.phone}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Email</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {patient.email || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 font-medium">Residential Address</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {patient.address || "None recorded"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 font-medium">Emergency Contact</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {patient.emergencyContact || "None"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Alert Card */}
          <Card className="bg-rose-50/40 border-rose-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Safety Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="text-slate-500 font-medium text-[11px]">Blood Group</p>
                <p className="font-bold text-slate-900 text-sm">{patient.bloodGroup || "Unknown"}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium text-[11px]">Documented Allergies</p>
                <p className="font-bold text-rose-700">
                  {patient.allergies || "No known allergies"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinical Encounters & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Clinical Encounter Timeline ({patient.encounters.length})
            </CardTitle>
            <CardDescription>
              Physician evaluations, symptoms, diagnoses, vitals, and prescribed medications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patient.encounters.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">
                No clinical encounters recorded yet.
              </p>
            ) : (
              <div className="space-y-6">
                {patient.encounters.map((enc) => (
                  <div key={enc.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-sm font-bold text-slate-900">
                          Dr. {enc.doctor.user.name}
                        </span>
                        <p className="text-xs text-slate-500">
                          {enc.doctor.specialization} • Encounter Date: {formatDate(enc.createdAt)}
                        </p>
                      </div>
                      <a href={`/api/prescriptions/${enc.id}/pdf`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="text-xs text-emerald-700 border-emerald-200">
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Prescription PDF
                        </Button>
                      </a>
                    </div>

                    {/* Vitals Bar */}
                    {enc.vitals && typeof enc.vitals === "object" && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap gap-4 text-xs">
                        {Object.entries(enc.vitals as Record<string, string>)
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-400 uppercase text-[10px] block font-semibold">
                                {k}
                              </span>
                              <span className="font-semibold text-slate-800">{v}</span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Symptoms & Diagnosis */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-slate-500">Symptoms:</p>
                        <p className="text-slate-800 mt-0.5">{enc.symptoms}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500">Diagnosis:</p>
                        <p className="text-slate-800 font-bold mt-0.5">{enc.diagnosis}</p>
                      </div>
                    </div>

                    {/* Prescriptions */}
                    {enc.prescriptions.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                        <p className="font-semibold text-teal-800">Prescribed Rx:</p>
                        {enc.prescriptions.map((rx) => (
                          <div key={rx.id} className="flex justify-between border-b border-slate-100 last:border-0 pb-1">
                            <span className="font-medium text-slate-800">
                              💊 {rx.medicine} — {rx.dosage}
                            </span>
                            <span className="text-slate-500">
                              {rx.frequency} for {rx.durationDays} days {rx.instructions ? `(${rx.instructions})` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Reports & Invoices in 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Medical Reports ({patient.reports.length})
              </CardTitle>
              <CardDescription>Laboratory tests, imaging, and PDF scans</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.reports.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">No reports uploaded.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {patient.reports.map((rep) => (
                    <div key={rep.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{rep.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(rep.createdAt)} • {(rep.fileSize / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Link href={`/reports`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-700">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Billing Invoices ({patient.invoices.length})
              </CardTitle>
              <CardDescription>Financial statements and payment ledger</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.invoices.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">No invoices generated.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {patient.invoices.map((inv) => (
                    <div key={inv.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-800">
                            {inv.invoiceNo}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(inv.createdAt)} • Total: {formatCurrency(inv.total)}
                        </p>
                      </div>
                      <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-700">
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
