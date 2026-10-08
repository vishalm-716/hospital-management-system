"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bed, UserPlus, LogOut, Wrench, CheckCircle, AlertCircle } from "lucide-react";
import { assignBedAction, dischargeBedAction, setBedStatusAction } from "@/app/actions/beds";

interface BedsClientProps {
  beds: any[];
  patients: any[];
  userRole: string;
}

export function BedsClient({ beds, patients, userRole }: BedsClientProps) {
  const router = useRouter();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Group beds by ward
  const wardsMap: Record<string, any[]> = {};
  beds.forEach((bed) => {
    if (!wardsMap[bed.ward]) wardsMap[bed.ward] = [];
    wardsMap[bed.ward].push(bed);
  });

  const handleOpenAssign = (bed: any) => {
    setSelectedBed(bed);
    setSelectedPatientId("");
    setAssignModalOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !selectedPatientId) return;
    setSubmitting(true);

    const fData = new FormData();
    fData.append("bedId", selectedBed.id);
    fData.append("patientId", selectedPatientId);

    const res = await assignBedAction(undefined, fData);
    setSubmitting(false);

    if (res?.success) {
      setAssignModalOpen(false);
      router.refresh();
    } else {
      alert(res?.error || "Failed to assign bed");
    }
  };

  const handleDischarge = async (bedId: string) => {
    if (!confirm("Are you sure you want to discharge the patient from this bed?")) return;
    try {
      await dischargeBedAction(bedId);
      router.refresh();
    } catch (err) {
      alert("Failed to discharge: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const handleToggleMaintenance = async (bed: any) => {
    const newStatus = bed.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE";
    const fData = new FormData();
    fData.append("bedId", bed.id);
    fData.append("status", newStatus);

    try {
      await setBedStatusAction(undefined, fData);
      router.refresh();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-8">
      {/* Bed Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-700">Status Indicator:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-slate-600">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-slate-600">Maintenance</span>
        </div>
      </div>

      {/* Wards Sections */}
      {Object.entries(wardsMap).map(([wardName, wardBeds]) => {
        const occupied = wardBeds.filter((b) => b.status === "OCCUPIED").length;

        return (
          <Card key={wardName}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">{wardName}</CardTitle>
                <CardDescription>
                  {occupied} occupied of {wardBeds.length} total beds ({Math.round((occupied / wardBeds.length) * 100)}% capacity)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wardBeds.map((bed) => (
                  <div
                    key={bed.id}
                    className={`p-4 rounded-xl border transition-all ${
                      bed.status === "OCCUPIED"
                        ? "bg-rose-50/40 border-rose-200"
                        : bed.status === "MAINTENANCE"
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-emerald-50/30 border-emerald-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {bed.number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bed.status === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : bed.status === "OCCUPIED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bed.status}
                      </span>
                    </div>

                    {bed.status === "OCCUPIED" && bed.patient ? (
                      <div className="space-y-1 mb-3">
                        <Link
                          href={`/patients/${bed.patient.id}`}
                          className="font-semibold text-xs text-teal-800 hover:underline block truncate"
                        >
                          👤 {bed.patient.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {bed.patient.mrn}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Admitted: {bed.assignedAt ? formatDate(bed.assignedAt) : "Recently"}
                        </p>
                      </div>
                    ) : (
                      <div className="h-12 flex items-center text-xs text-slate-400">
                        {bed.status === "MAINTENANCE" ? "Under sanitization/repair" : "Ready for admission"}
                      </div>
                    )}

                    {/* Bed Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      {bed.status === "AVAILABLE" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenAssign(bed)}
                          className="h-7 text-xs bg-teal-600 hover:bg-teal-500 text-white w-full"
                        >
                          <UserPlus className="h-3 w-3 mr-1" /> Assign Patient
                        </Button>
                      )}

                      {bed.status === "OCCUPIED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDischarge(bed.id)}
                          className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 w-full"
                        >
                          <LogOut className="h-3 w-3 mr-1" /> Discharge
                        </Button>
                      )}

                      {userRole === "ADMIN" && bed.status !== "OCCUPIED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleMaintenance(bed)}
                          className="h-7 text-[11px] text-slate-500 ml-1"
                          title="Toggle Maintenance"
                        >
                          <Wrench className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Modal: Assign Bed */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Bed to Inpatient</DialogTitle>
            <DialogDescription>
              Ward: {selectedBed?.ward} • Bed: <strong>{selectedBed?.number}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <Label className="text-xs">Select Patient</Label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="">Select Inpatient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-teal-600 text-white">
                {submitting ? "Assigning..." : "Confirm Admission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
