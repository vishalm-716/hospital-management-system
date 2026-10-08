import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Load all staff
  const staff = await prisma.user.findMany({
    where: { role: { not: "PATIENT" } },
    include: {
      doctorProfile: { include: { department: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Load departments
  const departments = await prisma.department.findMany({
    include: {
      doctors: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <Shell userRole="ADMIN" userName={session.user.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hospital System & Staff Administration
          </h1>
          <p className="text-sm text-slate-500">
            Manage medical personnel accounts, department structures, and security policies
          </p>
        </div>

        <SettingsClient
          staff={staff}
          departments={departments}
          currentUserId={session.user.id}
        />
      </div>
    </Shell>
  );
}
