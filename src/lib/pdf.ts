import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PrescriptionPDFData {
  hospitalName: string;
  doctorName: string;
  doctorSpecialization: string;
  department: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  vitals?: Record<string, string>;
  prescriptions: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions?: string | null;
  }>;
}

interface InvoicePDFData {
  hospitalName: string;
  invoiceNo: string;
  date: string;
  patientName: string;
  patientPhone: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
}

export async function generatePrescriptionPDF(
  data: PrescriptionPDFData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const teal = rgb(0.0, 0.51, 0.51);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  let y = 800;

  // Header
  page.drawRectangle({ x: 0, y: 790, width: 595, height: 52, color: teal });
  page.drawText(data.hospitalName, {
    x: 40, y: 810, size: 20, font: fontBold, color: rgb(1, 1, 1),
  });
  page.drawText("Prescription", {
    x: 40, y: 795, size: 10, font, color: rgb(0.9, 0.9, 0.9),
  });

  y = 770;
  // Doctor info
  page.drawText(`Dr. ${data.doctorName}`, { x: 40, y, size: 12, font: fontBold, color: black });
  y -= 15;
  page.drawText(`${data.doctorSpecialization} — ${data.department}`, { x: 40, y, size: 10, font, color: gray });
  y -= 15;
  page.drawText(`Date: ${data.date}`, { x: 40, y, size: 10, font, color: gray });

  // Patient info
  y -= 30;
  page.drawText("Patient Information", { x: 40, y, size: 12, font: fontBold, color: teal });
  y -= 18;
  page.drawText(`Name: ${data.patientName}    Age: ${data.patientAge}    Gender: ${data.patientGender}`, {
    x: 40, y, size: 10, font, color: black,
  });

  // Vitals
  if (data.vitals && Object.keys(data.vitals).length > 0) {
    y -= 25;
    page.drawText("Vitals", { x: 40, y, size: 12, font: fontBold, color: teal });
    y -= 16;
    const vitalsText = Object.entries(data.vitals)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join("   |   ");
    page.drawText(vitalsText, { x: 40, y, size: 10, font, color: black });
  }

  // Symptoms & Diagnosis
  y -= 25;
  page.drawText("Symptoms", { x: 40, y, size: 12, font: fontBold, color: teal });
  y -= 16;
  page.drawText(data.symptoms.substring(0, 100), { x: 40, y, size: 10, font, color: black });

  y -= 25;
  page.drawText("Diagnosis", { x: 40, y, size: 12, font: fontBold, color: teal });
  y -= 16;
  page.drawText(data.diagnosis.substring(0, 100), { x: 40, y, size: 10, font, color: black });

  // Prescriptions table
  y -= 30;
  page.drawText("Rx — Medications", { x: 40, y, size: 14, font: fontBold, color: teal });
  y -= 5;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: teal });
  y -= 18;

  // Table header
  page.drawText("Medicine", { x: 40, y, size: 9, font: fontBold, color: black });
  page.drawText("Dosage", { x: 200, y, size: 9, font: fontBold, color: black });
  page.drawText("Frequency", { x: 290, y, size: 9, font: fontBold, color: black });
  page.drawText("Duration", { x: 400, y, size: 9, font: fontBold, color: black });
  page.drawText("Instructions", { x: 460, y, size: 9, font: fontBold, color: black });

  y -= 5;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: gray });

  for (const rx of data.prescriptions) {
    y -= 18;
    if (y < 80) break;
    page.drawText(rx.medicine.substring(0, 25), { x: 40, y, size: 9, font, color: black });
    page.drawText(rx.dosage.substring(0, 15), { x: 200, y, size: 9, font, color: black });
    page.drawText(rx.frequency.substring(0, 15), { x: 290, y, size: 9, font, color: black });
    page.drawText(`${rx.durationDays} days`, { x: 400, y, size: 9, font, color: black });
    page.drawText((rx.instructions || "-").substring(0, 15), { x: 460, y, size: 9, font, color: black });
  }

  // Footer
  y = 50;
  page.drawLine({ start: { x: 40, y: y + 10 }, end: { x: 555, y: y + 10 }, thickness: 0.5, color: gray });
  page.drawText("This is a computer-generated prescription from MediCloud HMS.", {
    x: 40, y, size: 8, font, color: gray,
  });
  page.drawText("[!] ACADEMIC PROTOTYPE -- SYNTHETIC PATIENT DATA ONLY", {
    x: 40, y: y - 12, size: 8, font: fontBold, color: rgb(0.8, 0.2, 0.2),
  });

  return doc.save();
}

export async function generateInvoicePDF(
  data: InvoicePDFData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const teal = rgb(0.0, 0.51, 0.51);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  let y = 800;

  // Header
  page.drawRectangle({ x: 0, y: 790, width: 595, height: 52, color: teal });
  page.drawText(data.hospitalName, {
    x: 40, y: 810, size: 20, font: fontBold, color: rgb(1, 1, 1),
  });
  page.drawText("Tax Invoice", {
    x: 40, y: 795, size: 10, font, color: rgb(0.9, 0.9, 0.9),
  });

  // Invoice details
  y = 770;
  page.drawText(`Invoice No: ${data.invoiceNo}`, { x: 40, y, size: 11, font: fontBold, color: black });
  page.drawText(`Date: ${data.date}`, { x: 400, y, size: 10, font, color: gray });
  y -= 15;
  page.drawText(`Status: ${data.status}`, { x: 400, y, size: 10, font: fontBold, color: data.status === "PAID" ? rgb(0, 0.6, 0.3) : rgb(0.8, 0.5, 0) });

  // Patient
  y -= 15;
  page.drawText("Bill To:", { x: 40, y, size: 10, font: fontBold, color: teal });
  y -= 15;
  page.drawText(data.patientName, { x: 40, y, size: 10, font, color: black });
  y -= 14;
  page.drawText(`Phone: ${data.patientPhone}`, { x: 40, y, size: 9, font, color: gray });

  // Items table
  y -= 30;
  page.drawLine({ start: { x: 40, y: y + 5 }, end: { x: 555, y: y + 5 }, thickness: 1, color: teal });
  page.drawText("Description", { x: 40, y: y - 5, size: 9, font: fontBold, color: black });
  page.drawText("Qty", { x: 340, y: y - 5, size: 9, font: fontBold, color: black });
  page.drawText("Unit Price", { x: 390, y: y - 5, size: 9, font: fontBold, color: black });
  page.drawText("Amount", { x: 490, y: y - 5, size: 9, font: fontBold, color: black });
  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: gray });

  const formatPdfAmount = (amt: number) => "Rs. " + Math.round(amt).toLocaleString("en-IN");

  for (const item of data.items) {
    y -= 18;
    if (y < 150) break;
    page.drawText(item.description.substring(0, 45), { x: 40, y, size: 9, font, color: black });
    page.drawText(String(item.quantity), { x: 345, y, size: 9, font, color: black });
    page.drawText(formatPdfAmount(item.unitPrice), { x: 390, y, size: 9, font, color: black });
    page.drawText(formatPdfAmount(item.amount), { x: 490, y, size: 9, font, color: black });
  }

  // Totals
  y -= 20;
  page.drawLine({ start: { x: 350, y: y + 10 }, end: { x: 555, y: y + 10 }, thickness: 0.5, color: gray });
  page.drawText("Subtotal:", { x: 390, y, size: 10, font, color: black });
  page.drawText(formatPdfAmount(data.subtotal), { x: 490, y, size: 10, font, color: black });
  y -= 16;
  page.drawText("Tax (18% GST):", { x: 390, y, size: 10, font, color: black });
  page.drawText(formatPdfAmount(data.tax), { x: 490, y, size: 10, font, color: black });
  y -= 18;
  page.drawLine({ start: { x: 350, y: y + 8 }, end: { x: 555, y: y + 8 }, thickness: 1, color: teal });
  page.drawText("Total:", { x: 390, y, size: 12, font: fontBold, color: teal });
  page.drawText(formatPdfAmount(data.total), { x: 490, y, size: 12, font: fontBold, color: teal });

  if (data.paymentMethod) {
    y -= 20;
    page.drawText(`Payment: ${data.paymentMethod}`, { x: 390, y, size: 9, font, color: gray });
  }
  if (data.paidAt) {
    y -= 14;
    page.drawText(`Paid on: ${data.paidAt}`, { x: 390, y, size: 9, font, color: gray });
  }

  // Footer
  page.drawLine({ start: { x: 40, y: 60 }, end: { x: 555, y: 60 }, thickness: 0.5, color: gray });
  page.drawText("This is a computer-generated invoice from MediCloud HMS.", {
    x: 40, y: 48, size: 8, font, color: gray,
  });
  page.drawText("[!] ACADEMIC PROTOTYPE -- SYNTHETIC PATIENT DATA ONLY", {
    x: 40, y: 36, size: 8, font: fontBold, color: rgb(0.8, 0.2, 0.2),
  });

  return doc.save();
}
