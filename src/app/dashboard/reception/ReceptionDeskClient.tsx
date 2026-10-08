"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTime, formatCurrency, getStatusColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  Calendar,
  CheckCircle,
  CreditCard,
  Sparkles,
  Download,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { updateAppointmentStatusAction } from "@/app/actions/appointments";
import { createPatientAction, getPatients } from "@/app/actions/patients";
import { createInvoiceAction, recordPaymentAction } from "@/app/actions/billing";
import { triageSymptomsAction } from "@/app/actions/ai";

interface ReceptionDeskProps {
  appointments: Array<any>;
  doctors: Array<any>;
  departments: Array<any>;
}

export function ReceptionDeskClient({ appointments, doctors, departments }: ReceptionDeskProps) {
  const router = useRouter();
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Modals state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [triageModalOpen, setTriageModalOpen] = useState(false);

  // Selected item for invoice/payment
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // AI Triage state
  const [triageSymptoms, setTriageSymptoms] = useState("");
  const [triageAge, setTriageAge] = useState("");
  const [triageGender, setTriageGender] = useState("MALE");
  const [triageResult, setTriageResult] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Fast live search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await getPatients(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    setCheckingInId(appointmentId);
    try {
      await updateAppointmentStatusAction(appointmentId, "CHECKED_IN");
      router.refresh();
    } catch (err) {
      alert("Failed to check in patient: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setCheckingInId(null);
    }
  };

  // Run AI Triage
  const handleRunTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriageLoading(true);
    setTriageResult(null);

    const fData = new FormData();
    fData.append("symptoms", triageSymptoms);
    if (triageAge) fData.append("age", triageAge);
    fData.append("gender", triageGender);

    try {
      const res = await triageSymptomsAction(fData);
      setTriageResult(res);
    } catch (err) {
      setTriageResult({
        error: "AI Triage service temporarily unavailable.",
        disclaimer: "Please consult the on-duty medical officer directly.",
      });
    } finally {
      setTriageLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Patient Search & Quick Action Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Box */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-teal-600" />
              Patient Master Index Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by Patient Name, Phone, or MRN (e.g. Rohan, MRN-SYNTH-1001)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
              <Button type="submit" disabled={isSearching} className="bg-teal-600 hover:bg-teal-500 text-white">
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-4 border rounded-lg divide-y max-h-60 overflow-y-auto">
                {searchResults.map((pat) => (
                  <div key={pat.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-800">{pat.name}</p>
                      <p className="text-slate-500">
                        MRN: {pat.mrn} • Phone: {pat.phone} • Blood: {pat.bloodGroup || "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/patients/${pat.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Profile
                        </Button>
                      </Link>
                      <Link href={`/appointments/new?patientId=${pat.id}`}>
                        <Button size="sm" className="h-7 text-xs bg-teal-600 text-white">
                          Book
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tools */}
        <Card className="bg-gradient-to-br from-teal-500/10 to-transparent border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-teal-900">
              OPD Reception Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => setRegisterModalOpen(true)}
              className="w-full justify-start text-xs bg-white text-slate-800 hover:bg-slate-100 border shadow-sm"
            >
              <UserPlus className="h-4 w-4 mr-2 text-teal-600" />
              Register New Patient
            </Button>

            <Button
              onClick={() => setTriageModalOpen(true)}
              className="w-full justify-start text-xs bg-white text-slate-800 hover:bg-slate-100 border shadow-sm"
            >
              <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
              AI Symptom Triage Helper
            </Button>

            <Link href="/billing" className="block">
              <Button
                variant="outline"
                className="w-full justify-start text-xs bg-white text-slate-800 hover:bg-slate-100 border shadow-sm"
              >
                <CreditCard className="h-4 w-4 mr-2 text-emerald-600" />
                Hospital Invoices & Payments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Queue & Check-in Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Today&apos;s Front Desk Roster</CardTitle>
          <CardDescription>
            Patient arrivals, status tracking, and instant check-ins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor & Specialty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Desk Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {formatTime(appt.startsAt)}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/patients/${appt.patient.id}`} className="font-medium text-teal-700 hover:underline">
                          {appt.patient.name}
                        </Link>
                        <p className="text-xs text-slate-400">MRN: {appt.patient.mrn}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium">Dr. {appt.doctor.user.name}</p>
                        <p className="text-xs text-slate-400">{appt.department.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {appt.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            disabled={checkingInId === appt.id}
                            onClick={() => handleCheckIn(appt.id)}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            {checkingInId === appt.id ? "Checking In..." : "Check In"}
                          </Button>
                        )}
                        {appt.invoices && appt.invoices.length > 0 ? (
                          <a
                            href={`/api/invoices/${appt.invoices[0].id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-700 border-emerald-200">
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Bill PDF
                            </Button>
                          </a>
                        ) : (
                          <Link href={`/billing`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600">
                              Bill
                            </Button>
                          </Link>
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

      {/* Modal: AI Triage Assistant */}
      <Dialog open={triageModalOpen} onOpenChange={setTriageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="h-5 w-5" />
              Symptom Triage Routing Assistant
            </DialogTitle>
            <DialogDescription>
              Powered by Groq LLM • Suggests department and urgency for walk-in patients
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRunTriage} className="space-y-4">
            <div>
              <Label className="text-xs">Patient Chief Complaints / Symptoms</Label>
              <Input
                required
                placeholder="e.g. Severe chest tightness, radiating left arm pain, sweating..."
                value={triageSymptoms}
                onChange={(e) => setTriageSymptoms(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Patient Age</Label>
                <Input
                  type="number"
                  placeholder="54"
                  value={triageAge}
                  onChange={(e) => setTriageAge(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Gender</Label>
                <select
                  value={triageGender}
                  onChange={(e) => setTriageGender(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {triageLoading ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Evaluating clinical routing...
              </div>
            ) : triageResult ? (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2 text-xs">
                {triageResult.error ? (
                  <p className="text-rose-600">{triageResult.error}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-900">
                        Suggested: {triageResult.department}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          triageResult.urgency === "HIGH"
                            ? "bg-rose-100 text-rose-800"
                            : triageResult.urgency === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {triageResult.urgency} URGENCY
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px]">{triageResult.reasoning}</p>
                  </>
                )}
                <p className="text-[10px] text-slate-500 border-t border-indigo-200/50 pt-1">
                  {triageResult.disclaimer}
                </p>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTriageModalOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={triageLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {triageLoading ? "Analyzing..." : "Analyze Symptoms"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
