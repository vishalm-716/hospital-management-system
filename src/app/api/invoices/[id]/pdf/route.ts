import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: true,
      items: true,
    },
  });

  if (!invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }

  // Authorization check
  if (session.user.role === "PATIENT" && invoice.patient.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const pdfBytes = await generateInvoicePDF({
    hospitalName: process.env.NEXT_PUBLIC_APP_NAME || "MediCloud Hospital",
    invoiceNo: invoice.invoiceNo,
    date: invoice.createdAt.toLocaleDateString("en-IN"),
    patientName: invoice.patient.name,
    patientPhone: invoice.patient.phone,
    items: invoice.items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    paidAt: invoice.paidAt ? invoice.paidAt.toLocaleDateString("en-IN") : null,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice_${invoice.invoiceNo}.pdf"`,
    },
  });
}
