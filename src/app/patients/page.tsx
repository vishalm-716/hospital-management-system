import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPatients } from "@/app/actions/patients";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Users, UserPlus, Search, ArrowRight } from "lucide-react";
import { PatientSearchFilter } from "./PatientSearchFilter";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { q } = await searchParams;
  const patients = await getPatients(q);

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Patient Registry
            </h1>
            <p className="text-sm text-slate-500">
              Master index of hospital patient health records and demographics
            </p>
          </div>
          {session.user.role !== "PATIENT" && (
            <Link href="/dashboard/reception">
              <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                <UserPlus className="h-4 w-4 mr-1" />
                Register New Patient
              </Button>
            </Link>
          )}
        </div>

        {/* Live Search Filter */}
        <PatientSearchFilter initialQuery={q || ""} />

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Patients Found ({patients.length})
            </CardTitle>
            <CardDescription>
              Showing matching synthetic records from hospital directory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-700">No patients matched your query</p>
                <p className="text-xs text-slate-400">Try searching with a different term or MRN</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">MRN</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">DOB / Gender</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.map((pat) => (
                      <tr key={pat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-teal-800">
                          {pat.mrn}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {pat.name}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {formatDate(pat.dateOfBirth)} ({pat.gender})
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {pat.phone}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700">
                          {pat.bloodGroup || "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/patients/${pat.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-teal-700 hover:text-teal-800">
                              View Profile <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
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
    </Shell>
  );
}
