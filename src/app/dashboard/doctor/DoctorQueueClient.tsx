"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTime, getStatusColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  Sparkles,
  FileText,
  Stethoscope,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  AlertTriangle,
} from "lucide-react";
import { updateAppointmentStatusAction } from "@/app/actions/appointments";
import { createEncounterAction } from "@/app/actions/encounters";
import { summarizePatientHistoryAction } from "@/app/actions/ai";

interface AppointmentItem {
  id: string;
  startsAt: Date;
  status: string;
  reason: string;
  patient: {
    id: string;
    name: string;
    mrn: string;
    phone: string;
    bloodGroup?: string | null;
    allergies?: string | null;
  };
  encounter?: {
    id: string;
    symptoms: string;
    diagnosis: string;
    prescriptions: Array<{
      id: string;
      medicine: string;
      dosage: string;
      frequency: string;
      durationDays: number;
    }>;
  } | null;
}

export function DoctorQueueClient({ appointments }: { appointments: AppointmentItem[] }) {
  const router = useRouter();
  const [selectedAppt, setSelectedAppt] = useState<AppointmentItem | null>(null);
  const [encounterModalOpen, setEncounterModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ summary: string; disclaimer: string; error?: string | null } | null>(null);

  // Encounter form state
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState({ bp: "", pulse: "", temp: "", spo2: "", weight: "" });
  const [prescriptions, setPrescriptions] = useState<
    Array<{ medicine: string; dosage: string; frequency: string; durationDays: number; instructions: string }>
  >([]);
  const [submittingEncounter, setSubmittingEncounter] = useState(false);

  const handleOpenEncounter = (appt: AppointmentItem) => {
    setSelectedAppt(appt);
    setSymptoms(appt.reason || "");
    setDiagnosis("");
    setNotes("");
    setVitals({ bp: "120/80", pulse: "74", temp: "98.6", spo2: "99", weight: "70" });
    setPrescriptions([
      { medicine: "Paracetamol 650mg", dosage: "1 Tablet", frequency: "SOS after food", durationDays: 3, instructions: "When feverish" },
    ]);
    setEncounterModalOpen(true);
  };

  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicine: "", dosage: "1 Tab", frequency: "Twice daily", durationDays: 5, instructions: "After food" },
    ]);
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleSaveEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setSubmittingEncounter(true);

    const fData = new FormData();
    fData.append("appointmentId", selectedAppt.id);
    fData.append("symptoms", symptoms);
    fData.append("diagnosis", diagnosis);
    fData.append("notes", notes);
    fData.append("vitals_bp", vitals.bp);
    fData.append("vitals_pulse", vitals.pulse);
    fData.append("vitals_temp", vitals.temp);
    fData.append("vitals_spo2", vitals.spo2);
    fData.append("vitals_weight", vitals.weight);
    fData.append("prescriptions", JSON.stringify(prescriptions));

    const res = await createEncounterAction(undefined, fData);
    setSubmittingEncounter(false);
    if (res?.success) {
      setEncounterModalOpen(false);
      router.refresh();
    } else {
      alert(res?.error || "Failed to record encounter");
    }
  };

  const handleGenerateAiSummary = async (patientId: string, appt: AppointmentItem) => {
    setSelectedAppt(appt);
    setAiLoading(true);
    setAiModalOpen(true);
    setAiSummary(null);

    try {
      const res = await summarizePatientHistoryAction(patientId);
      setAiSummary(res);
    } catch (err) {
      setAiSummary({
        summary: "",
        disclaimer: "AI service encountered an issue.",
        error: err instanceof Error ? err.message : "Failed to generate summary",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Today&apos;s Consultation Queue</CardTitle>
        <CardDescription>
          Patient roster for today with one-click encounter recording and clinical AI summarizer
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Stethoscope className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No appointments scheduled for today</p>
            <p className="text-xs text-slate-400">All caught up or clinic is closed for today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Chief Complaint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatTime(appt.startsAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/patients/${appt.patient.id}`}
                        className="font-medium text-teal-700 hover:underline"
                      >
                        {appt.patient.name}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {appt.patient.mrn} • {appt.patient.bloodGroup || "Blood Group N/A"}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {appt.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                          appt.status
                        )}`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {/* AI History Summary Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateAiSummary(appt.patient.id, appt)}
                        className="text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                        title="AI Patient History Summary (De-identified)"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                        AI Summary
                      </Button>

                      {/* If encounter completed, offer prescription PDF */}
                      {appt.encounter ? (
                        <a
                          href={`/api/prescriptions/${appt.encounter.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Rx PDF
                          </Button>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenEncounter(appt)}
                          className="bg-teal-600 hover:bg-teal-500 text-white"
                        >
                          <Stethoscope className="h-3.5 w-3.5 mr-1" />
                          Consult
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Modal 1: Clinical Encounter & Prescription Form */}
      <Dialog open={encounterModalOpen} onOpenChange={setEncounterModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-800">
              <Stethoscope className="h-5 w-5" />
              Record Clinical Encounter
            </DialogTitle>
            <DialogDescription>
              Patient: {selectedAppt?.patient.name} ({selectedAppt?.patient.mrn})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEncounter} className="space-y-4">
            {/* Vitals */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-2">Patient Vitals</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <Label className="text-[11px]">BP (mmHg)</Label>
                  <Input
                    value={vitals.bp}
                    onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                    placeholder="120/80"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Pulse (bpm)</Label>
                  <Input
                    value={vitals.pulse}
                    onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                    placeholder="72"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Temp (°F)</Label>
                  <Input
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                    placeholder="98.6"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">SpO2 (%)</Label>
                  <Input
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                    placeholder="99"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Weight (kg)</Label>
                  <Input
                    value={vitals.weight}
                    onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                    placeholder="70"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms & Diagnosis */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Symptoms / Chief Complaints</Label>
                <Textarea
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Patient reports persistent dry cough and mild fever..."
                  className="min-h-[60px] text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Clinical Diagnosis</Label>
                <Input
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Upper Respiratory Tract Infection (URTI)"
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Clinical Notes & Follow-up Instructions</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Advised steam inhalation, warm fluids, follow up in 5 days if unresolved."
                  className="min-h-[50px] text-xs"
                />
              </div>
            </div>

            {/* Prescriptions */}
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-slate-800">
                  Prescription (Rx)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPrescription}
                  className="text-xs h-7"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Medicine
                </Button>
              </div>

              <div className="space-y-2">
                {prescriptions.map((rx, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center"
                  >
                    <div className="sm:col-span-4">
                      <Input
                        required
                        placeholder="Medicine name (e.g., Amoxicillin 500mg)"
                        value={rx.medicine}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].medicine = e.target.value;
                          setPrescriptions(updated);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        placeholder="Dosage (1 Tab)"
                        value={rx.dosage}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].dosage = e.target.value;
                          setPrescriptions(updated);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        placeholder="Frequency (TDS)"
                        value={rx.frequency}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].frequency = e.target.value;
                          setPrescriptions(updated);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Days (5)"
                        value={rx.durationDays}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].durationDays = Number(e.target.value);
                          setPrescriptions(updated);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePrescription(idx)}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEncounterModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingEncounter}
                className="bg-teal-600 hover:bg-teal-500 text-white"
              >
                {submittingEncounter ? "Saving Encounter..." : "Finalize Consultation & Generate Rx"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: AI Clinical History Summary */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="h-5 w-5" />
              AI Clinical Patient Summary
            </DialogTitle>
            <DialogDescription>
              De-identified clinical history generated via Groq (Llama-3.3-70B)
            </DialogDescription>
          </DialogHeader>

          {aiLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                Analyzing de-identified clinical records...
              </p>
              <p className="text-xs text-slate-400">
                Identifiers stripped. Consulting Groq LLM inference...
              </p>
            </div>
          ) : aiSummary ? (
            <div className="space-y-4">
              {aiSummary.error ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>{aiSummary.error}</span>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {aiSummary.summary}
                </div>
              )}

              {/* Mandatory AI Safety Disclaimer */}
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{aiSummary.disclaimer}</span>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
