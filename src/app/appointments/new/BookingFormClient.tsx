"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Stethoscope, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { getAvailableSlots, createAppointmentAction } from "@/app/actions/appointments";
import { getPatients } from "@/app/actions/patients";

interface BookingFormClientProps {
  departments: any[];
  doctors: any[];
  currentPatient: any | null;
  preselectedPatient: any | null;
  userRole: string;
}

export function BookingFormClient({
  departments,
  doctors,
  currentPatient,
  preselectedPatient,
  userRole,
}: BookingFormClientProps) {
  const router = useRouter();

  // Patient selector state (if staff)
  const [patientId, setPatientId] = useState(
    currentPatient?.id || preselectedPatient?.id || ""
  );
  const [patientSearch, setPatientSearch] = useState(
    currentPatient?.name || preselectedPatient?.name || ""
  );
  const [patientOptions, setPatientOptions] = useState<any[]>([]);

  // Form selections
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [slots, setSlots] = useState<Array<{ time: string; startsAt: string; available: boolean }>>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter doctors by chosen department
  const filteredDoctors = selectedDept
    ? doctors.filter((d) => d.departmentId === selectedDept)
    : doctors;

  // Search patients if staff
  const handlePatientSearch = async (val: string) => {
    setPatientSearch(val);
    if (val.trim().length >= 2) {
      const res = await getPatients(val);
      setPatientOptions(res);
    } else {
      setPatientOptions([]);
    }
  };

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setSlots([]);
      return;
    }

    let active = true;
    setSlotsLoading(true);
    setSelectedSlot("");

    getAvailableSlots(selectedDoctor, selectedDate)
      .then((data) => {
        if (active) setSlots(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setSlots([]);
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDoctor, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!patientId) {
      setError("Please select a patient.");
      return;
    }
    if (!selectedDoctor) {
      setError("Please select a doctor.");
      return;
    }
    if (!selectedSlot) {
      setError("Please pick an available time slot.");
      return;
    }

    setSubmitting(true);

    const doc = doctors.find((d) => d.id === selectedDoctor);
    const deptId = doc?.departmentId || selectedDept;

    const fData = new FormData();
    fData.append("patientId", patientId);
    fData.append("doctorId", selectedDoctor);
    fData.append("departmentId", deptId);
    fData.append("date", selectedDate);
    fData.append("time", selectedSlot);
    fData.append("reason", reason);
    fData.append("notes", notes);

    const res = await createAppointmentAction(undefined, fData);
    setSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/appointments");
      router.refresh();
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Appointment Booking Details</CardTitle>
        <CardDescription>
          Real-time slot availability checked against clinical schedules
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Selection (If staff) */}
          {userRole !== "PATIENT" ? (
            <div className="space-y-2">
              <Label className="text-xs">Patient (Search Name or MRN)</Label>
              <Input
                placeholder="Type to search patients..."
                value={patientSearch}
                onChange={(e) => handlePatientSearch(e.target.value)}
                className="text-xs"
              />
              {patientOptions.length > 0 && (
                <div className="border rounded-lg max-h-40 overflow-y-auto divide-y text-xs bg-white shadow-lg">
                  {patientOptions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setPatientId(p.id);
                        setPatientSearch(`${p.name} (${p.mrn})`);
                        setPatientOptions([]);
                      }}
                      className="p-2.5 hover:bg-teal-50 cursor-pointer flex justify-between"
                    >
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{p.mrn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-100 text-xs flex items-center justify-between">
              <div>
                <span className="text-teal-900 font-semibold block">Booking For:</span>
                <span className="text-slate-800">{currentPatient?.name}</span>
              </div>
              <span className="font-mono text-teal-700 font-semibold">{currentPatient?.mrn}</span>
            </div>
          )}

          {/* Department & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Clinical Specialty / Department</Label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedDoctor("");
                }}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Physician / Consultant</Label>
              <select
                required
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="">Select Doctor</option>
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.user.name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-xs">Appointment Date</Label>
            <Input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Available Slots Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-800">
              Available Consultation Slots
            </Label>
            {slotsLoading ? (
              <p className="text-xs text-slate-500 py-3">Checking doctor schedule...</p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-200">
                No slots available on this date. Doctor may not be working or all slots are booked.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {slots.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.startsAt)}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      !slot.available
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through"
                        : selectedSlot === slot.startsAt
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-white text-slate-800 border-slate-300 hover:border-teal-500 hover:bg-teal-50/50"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason for Visit */}
          <div className="space-y-2">
            <Label className="text-xs">Reason for Visit / Chief Complaint</Label>
            <Textarea
              required
              placeholder="e.g. Chest discomfort, follow up on hypertension, blood pressure review..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[60px] text-xs"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            {submitting ? "Confirming Slot..." : "Confirm & Book Appointment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
