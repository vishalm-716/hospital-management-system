"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download, ShieldCheck, AlertCircle } from "lucide-react";
import { getReportSignedUrlAction } from "@/app/actions/reports";

interface ReportsListClientProps {
  reports: any[];
  userRole: string;
}

export function ReportsListClient({ reports, userRole }: ReportsListClientProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleOpenReport = async (reportId: string) => {
    setLoadingId(reportId);
    try {
      const res = await getReportSignedUrlAction(reportId);
      if (res?.url) {
        window.open(res.url, "_blank");
      }
    } catch (err) {
      alert("Could not load signed report URL: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Medical Documents & Diagnostic Scans ({reports.length})
        </CardTitle>
        <CardDescription>
          Access is strictly authorized. Viewing creates an immutable security audit entry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No medical reports available</p>
            <p className="text-xs text-slate-400">Reports uploaded by clinicians will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">File Size / Format</th>
                  <th className="py-3 px-4 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 text-xs">
                      {rep.title}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <Link
                        href={`/patients/${rep.patient.id}`}
                        className="font-medium text-teal-700 hover:underline"
                      >
                        {rep.patient.name}
                      </Link>
                      <span className="block text-[11px] text-slate-400">{rep.patient.mrn}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {rep.uploadedBy?.name || "Staff"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(rep.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {(rep.fileSize / 1024).toFixed(0)} KB • {rep.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === rep.id}
                        onClick={() => handleOpenReport(rep.id)}
                        className="h-8 text-xs text-teal-700 border-teal-200 hover:bg-teal-50"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {loadingId === rep.id ? "Authorizing..." : "View Signed"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
