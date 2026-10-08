"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  Server,
} from "lucide-react";
import { toggleStaffStatusAction, createStaffAction } from "@/app/actions/admin";

interface SettingsClientProps {
  staff: any[];
  departments: any[];
  currentUserId: string;
}

export function SettingsClient({ staff, departments, currentUserId }: SettingsClientProps) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
    phone: "",
    departmentId: "",
    specialization: "",
    consultationFee: "500",
  });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleStaffStatusAction(id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const fData = new FormData();
    Object.entries(formData).forEach(([k, v]) => fData.append(k, v));

    const res = await createStaffAction(undefined, fData);
    setSubmitting(false);

    if (res?.success) {
      setAddModalOpen(false);
      router.refresh();
    } else {
      alert(res?.error || "Failed to create staff member");
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-teal-100 bg-teal-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                Total Staff Members
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{staff.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                Hospital Departments
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{departments.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                API & Health Monitor
              </p>
              <a href="/api/health" target="_blank" className="text-xs text-teal-700 font-semibold hover:underline mt-1 block">
                /api/health • Healthy
              </a>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Server className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Management Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Hospital Personnel Directory</CardTitle>
            <CardDescription>
              Activate, deactivate, or appoint doctors, receptionists, and administrators
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Staff Member
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department / Details</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {s.name}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {s.email}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={s.role === "ADMIN" ? "destructive" : s.role === "DOCTOR" ? "default" : "secondary"}>
                        {s.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.doctorProfile ? (
                        <span>
                          {s.doctorProfile.department.name} • {s.doctorProfile.specialization}
                        </span>
                      ) : (
                        "Hospital Operations"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          s.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {s.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.id !== currentUserId && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={togglingId === s.id}
                          onClick={() => handleToggle(s.id)}
                          className={`h-7 text-xs ${
                            s.isActive
                              ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {togglingId === s.id
                            ? "Updating..."
                            : s.isActive
                            ? "Deactivate Account"
                            : "Activate Account"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Clinical Departments ({departments.length})</CardTitle>
          <CardDescription>Configured medical services and active clinicians</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1">
                <p className="font-semibold text-slate-900 text-sm">{dept.name}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{dept.description}</p>
                <p className="text-[11px] text-teal-700 font-medium pt-2">
                  🩺 {dept.doctors?.length || 0} Physicians Appointed
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Add Staff Member */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medical / Staff Personnel</DialogTitle>
            <DialogDescription>Create credentials for new hospital staff</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input
                required
                placeholder="Dr. Suman Roy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Hospital Email</Label>
              <Input
                type="email"
                required
                placeholder="suman@medicloud.demo"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Initial Password</Label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Role</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  placeholder="+91 98..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            {formData.role === "DOCTOR" && (
              <>
                <div>
                  <Label className="text-xs">Department</Label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Specialization</Label>
                  <Input
                    required
                    placeholder="e.g. Senior Pediatrician"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Consultation Fee (INR)</Label>
                  <Input
                    type="number"
                    min="100"
                    placeholder="600"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </>
            )}

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-teal-600 text-white">
                {submitting ? "Creating..." : "Save Personnel Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
