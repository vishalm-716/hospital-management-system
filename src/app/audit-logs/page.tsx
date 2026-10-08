import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAuditLogs } from "@/app/actions/admin";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { ShieldAlert, Filter, Search } from "lucide-react";
import { AuditLogsFilter } from "./AuditLogsFilter";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const filters = await searchParams;
  const logs = await getAuditLogs(filters);

  return (
    <Shell userRole="ADMIN" userName={session.user.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Security & Compliance Audit Trail
          </h1>
          <p className="text-sm text-slate-500">
            Immutable log of all clinical data reads, modifications, payments, and admissions
          </p>
        </div>

        {/* Filter controls */}
        <AuditLogsFilter initialEntity={filters.entity || ""} initialAction={filters.action || ""} />

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Audit Events ({logs.length})
            </CardTitle>
            <CardDescription>
              Showing recent security events with actor ID, entity ID, and metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-500">
                No audit logs found matching the filter criteria.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Actor (User)</th>
                      <th className="py-2.5 px-3">IP Address</th>
                      <th className="py-2.5 px-3">Metadata JSON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-600 font-sans">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-teal-800">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {log.entity}
                          {log.entityId && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                              {log.entityId}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-medium text-slate-900 block">
                            {log.user?.name || "System"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {log.user?.role || "SYSTEM"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {log.ipAddress || "127.0.0.1"}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : "—"}
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
