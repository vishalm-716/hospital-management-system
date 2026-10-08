"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { invoiceSchema, paymentSchema } from "@/lib/validations";
import { generateInvoiceNo } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getInvoices(filters?: {
  patientId?: string;
  status?: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {};

  if (session.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!patient) return [];
    where.patientId = patient.id;
  } else if (filters?.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters?.status) where.status = filters.status;

  return prisma.invoice.findMany({
    where,
    include: {
      patient: true,
      items: true,
      appointment: {
        include: {
          doctor: { include: { user: true } },
          department: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: true,
      items: true,
      appointment: {
        include: {
          doctor: { include: { user: true } },
          department: true,
        },
      },
    },
  });

  if (!invoice) return null;

  if (session.user.role === "PATIENT") {
    if (invoice.patient.userId !== session.user.id) {
      throw new Error("Forbidden");
    }
  }

  await createAuditLog({
    userId: session.user.id,
    action: "READ_INVOICE",
    entity: "Invoice",
    entityId: invoice.id,
    metadata: { invoiceNo: invoice.invoiceNo, total: invoice.total },
  });

  return invoice;
}

export async function createInvoiceAction(
  _prevState: { error?: string; success?: boolean; invoiceId?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
    return { error: "Forbidden: Only Admin or Receptionist can create invoices" };
  }

  let itemsData: Array<{ description: string; quantity: number; unitPrice: number }> = [];
  try {
    const rawItems = formData.get("items") as string;
    itemsData = JSON.parse(rawItems);
  } catch {
    return { error: "Invalid invoice line items" };
  }

  const rawData = {
    patientId: formData.get("patientId") as string,
    appointmentId: (formData.get("appointmentId") as string) || undefined,
    items: itemsData,
  };

  const parsed = invoiceSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Validation failed" };
  }

  try {
    // Calculate totals server-side
    const subtotal = parsed.data.items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + tax;

    const invoiceNo = generateInvoiceNo();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        patientId: parsed.data.patientId,
        appointmentId: parsed.data.appointmentId || null,
        status: "PENDING",
        subtotal,
        tax,
        total,
        items: {
          create: parsed.data.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: it.quantity * it.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE_INVOICE",
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNo, subtotal, tax, total },
    });

    revalidatePath("/billing");
    revalidatePath(`/patients/${parsed.data.patientId}`);
    return { success: true, invoiceId: invoice.id };
  } catch (err) {
    console.error("Create invoice error:", err);
    return { error: "Failed to generate invoice" };
  }
}

export async function recordPaymentAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
    return { error: "Forbidden: Only Admin or Receptionist can record payments" };
  }

  const rawData = {
    invoiceId: formData.get("invoiceId") as string,
    paymentMethod: formData.get("paymentMethod") as "CASH" | "CARD" | "UPI" | "INSURANCE" | "OTHER",
  };

  const parsed = paymentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Validation failed" };
  }

  try {
    // Transaction to prevent duplicate payment race conditions
    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { id: parsed.data.invoiceId },
      });

      if (!inv) throw new Error("Invoice not found");

      // Business rule: Payment cannot be recorded twice
      if (inv.status === "PAID") {
        throw new Error("This invoice is already paid. Cannot record payment twice.");
      }

      return tx.invoice.update({
        where: { id: parsed.data.invoiceId },
        data: {
          status: "PAID",
          paymentMethod: parsed.data.paymentMethod,
          paidAt: new Date(),
        },
      });
    });

    await createAuditLog({
      userId: session.user.id,
      action: "RECORD_PAYMENT",
      entity: "Invoice",
      entityId: updated.id,
      metadata: {
        invoiceNo: updated.invoiceNo,
        amount: updated.total,
        method: parsed.data.paymentMethod,
      },
    });

    revalidatePath("/billing");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Payment recording failed";
    return { error: msg };
  }
}
