import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getInvoices } from "@/app/actions/billing";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const invoices = await getInvoices();

  // If receptionist or admin, load patients list for invoice creation
  let patients: any[] = [];
  if (session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST") {
    patients = await prisma.patient.findMany({
      take: 50,
      orderBy: { name: "asc" },
      select: { id: true, name: true, mrn: true },
    });
  }

  return (
    <Shell userRole={session.user.role} userName={session.user.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500">
            Tax invoices, GST calculation, payments, and PDF receipts
          </p>
        </div>

        <BillingClient
          invoices={invoices}
          patients={patients}
          userRole={session.user.role}
        />
      </div>
    </Shell>
  );
}
