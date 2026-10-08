"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { createInvoiceAction, recordPaymentAction } from "@/app/actions/billing";

interface BillingClientProps {
  invoices: any[];
  patients: any[];
  userRole: string;
}

export function BillingClient({ invoices, patients, userRole }: BillingClientProps) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // New Invoice Form
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: "General Outpatient Consultation", quantity: 1, unitPrice: 500 },
  ]);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Payment Form
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI" | "INSURANCE" | "OTHER">("UPI");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || items.length === 0) return;
    setSubmittingInvoice(true);

    const fData = new FormData();
    fData.append("patientId", patientId);
    fData.append("items", JSON.stringify(items));

    const res = await createInvoiceAction(undefined, fData);
    setSubmittingInvoice(false);

    if (res?.success) {
      setCreateModalOpen(false);
      router.refresh();
    } else {
      alert(res?.error || "Failed to create invoice");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setRecordingPayment(true);

    const fData = new FormData();
    fData.append("invoiceId", selectedInvoice.id);
    fData.append("paymentMethod", paymentMethod);

    const res = await recordPaymentAction(undefined, fData);
    setRecordingPayment(false);

    if (res?.success) {
      setPaymentModalOpen(false);
      router.refresh();
    } else {
      alert(res?.error || "Failed to record payment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Invoice Action Button */}
      {(userRole === "ADMIN" || userRole === "RECEPTIONIST") && (
        <div className="flex justify-end">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Generate New Invoice
          </Button>
        </div>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Hospital Invoice Registry ({invoices.length})
          </CardTitle>
          <CardDescription>
            Tax invoices with 18% GST and settlement records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No invoices on record</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">Total (GST)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-xs text-slate-800">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <Link
                          href={`/patients/${inv.patient.id}`}
                          className="font-medium text-teal-700 hover:underline"
                        >
                          {inv.patient.name}
                        </Link>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {inv.patient.mrn}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-900">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                        {inv.paymentMethod && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            via {inv.paymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {inv.status === "PENDING" && (userRole === "ADMIN" || userRole === "RECEPTIONIST") && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                          >
                            Record Pay
                          </Button>
                        )}
                        <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create Invoice */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate New Hospital Tax Invoice</DialogTitle>
            <DialogDescription>
              Line items with automated 18% GST server calculation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <Label className="text-xs">Patient</Label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items */}
            <div className="space-y-2 border-t pt-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Billable Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              {items.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center text-xs">
                  <Input
                    required
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].description = e.target.value;
                      setItems(updated);
                    }}
                    className="flex-1 h-8 text-xs"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].quantity = Number(e.target.value);
                      setItems(updated);
                    }}
                    className="w-16 h-8 text-xs"
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Rate"
                    value={it.unitPrice}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].unitPrice = Number(e.target.value);
                      setItems(updated);
                    }}
                    className="w-24 h-8 text-xs"
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(idx)}
                      className="h-8 w-8 text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Calculations Summary */}
            <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST (18%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                <span>Grand Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingInvoice} className="bg-teal-600 text-white">
                {submittingInvoice ? "Creating..." : "Issue Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Record Payment */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment Settlement</DialogTitle>
            <DialogDescription>
              Invoice: {selectedInvoice?.invoiceNo} • Total:{" "}
              <strong>{selectedInvoice ? formatCurrency(selectedInvoice.total) : ""}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <Label className="text-xs">Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="INSURANCE">TPA / Health Insurance</option>
                <option value="OTHER">Other NetBanking</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordingPayment} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {recordingPayment ? "Settling..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
