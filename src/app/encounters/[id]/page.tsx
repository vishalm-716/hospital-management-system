import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEncounterById } from "@/app/actions/encounters";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import {
  Stethoscope,
  Download,
  Calendar,
  User,
  HeartPulse,
  ArrowLeft,
  FileText,
} from "lucide-react";

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  let encounter;
  try {
    encounter = await getEncounterById(id);
  } catch {
    redirect("/dashboard");
  }

  if (!encounter) notFound();

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href={`/patients/${encounter.patientId}`}
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Patient Record
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Clinical Encounter File
              </h1>
              <p className="text-sm text-slate-500">
                Evaluation on {formatDate(encounter.createdAt)} • Patient:{" "}
                <span className="font-semibold text-slate-800">{encounter.patient.name}</span> (
                {encounter.patient.mrn})
              </p>
            </div>
            <a href={`/api/prescriptions/${encounter.id}/pdf`} target="_blank" rel="noreferrer">
              <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                <Download className="h-4 w-4 mr-1" />
                Download Prescription PDF
              </Button>
            </a>
          </div>
        </div>

        {/* Doctor and Clinic Info */}
        <Card className="bg-slate-50/50 border-slate-200">
          <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Attending Physician</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                Dr. {encounter.doctor.user.name}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Specialty</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {encounter.doctor.specialization}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Department</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {encounter.doctor.department.name}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Encounter Time</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {formatTime(encounter.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vitals */}
        {encounter.vitals && typeof encounter.vitals === "object" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-600" />
                Physiological Vitals Recorded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 text-xs">
                {Object.entries(encounter.vitals as Record<string, string>)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 min-w-[100px]">
                      <span className="text-slate-400 uppercase text-[10px] block font-semibold">
                        {k}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{v}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Symptoms & Diagnosis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Symptoms & Chief Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-700 leading-relaxed">{encounter.symptoms}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Clinical Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-teal-900">{encounter.diagnosis}</p>
              {encounter.notes && (
                <p className="text-xs text-slate-600 mt-2 border-t pt-2">
                  <strong>Notes:</strong> {encounter.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prescribed Drugs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Prescribed Drugs & Regimen (Rx)</CardTitle>
          </CardHeader>
          <CardContent>
            {encounter.prescriptions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No medications prescribed.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b">
                    <tr>
                      <th className="py-2.5 px-3">Medicine</th>
                      <th className="py-2.5 px-3">Dosage</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {encounter.prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{rx.medicine}</td>
                        <td className="py-2.5 px-3 text-slate-600">{rx.dosage}</td>
                        <td className="py-2.5 px-3 text-slate-600">{rx.frequency}</td>
                        <td className="py-2.5 px-3 text-slate-600">{rx.durationDays} days</td>
                        <td className="py-2.5 px-3 text-slate-500">{rx.instructions || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
