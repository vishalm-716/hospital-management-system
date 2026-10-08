import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBeds } from "@/app/actions/beds";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { BedsClient } from "./BedsClient";

export default async function BedsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
    redirect("/dashboard");
  }

  const beds = await getBeds();

  // Load patients without bed assignment for assignment modal
  const patients = await prisma.patient.findMany({
    take: 50,
    orderBy: { name: "asc" },
    select: { id: true, name: true, mrn: true },
  });

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inpatient Bed & Ward Management
          </h1>
          <p className="text-sm text-slate-500">
            Real-time occupancy status across hospital wards, admissions, and discharges
          </p>
        </div>

        <BedsClient beds={beds} patients={patients} userRole={session.user.role} />
      </div>
    </Shell>
  );
}
