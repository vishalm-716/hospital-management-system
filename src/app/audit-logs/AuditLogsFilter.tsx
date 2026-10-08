"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";

export function AuditLogsFilter({
  initialEntity,
  initialAction,
}: {
  initialEntity: string;
  initialAction: string;
}) {
  const router = useRouter();
  const [entity, setEntity] = useState(initialEntity);
  const [action, setAction] = useState(initialAction);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (entity) params.set("entity", entity);
    if (action) params.set("action", action);
    router.push(`/audit-logs?${params.toString()}`);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-48">
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Patient">Patient</option>
              <option value="Appointment">Appointment</option>
              <option value="Encounter">Encounter</option>
              <option value="Invoice">Invoice</option>
              <option value="Bed">Bed</option>
              <option value="MedicalReport">MedicalReport</option>
            </select>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search action keyword..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="text-xs h-9 bg-white"
            />
          </div>

          <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-9">
            <Filter className="h-3.5 w-3.5 mr-1" /> Filter Logs
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
