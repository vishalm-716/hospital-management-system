"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Calendar, Upload, Sparkles, AlertTriangle } from "lucide-react";
import { uploadReportAction } from "@/app/actions/reports";
import { summarizePatientHistoryAction } from "@/app/actions/ai";

interface PatientDetailActionsProps {
  patientId: string;
  patientName: string;
  userRole: string;
}

export function PatientDetailActions({
  patientId,
  patientName,
  userRole,
}: PatientDetailActionsProps) {
  const router = useRouter();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle) return;
    setUploading(true);

    const fData = new FormData();
    fData.append("patientId", patientId);
    fData.append("title", uploadTitle);
    fData.append("file", selectedFile);

    const res = await uploadReportAction(undefined, fData);
    setUploading(false);

    if (res?.success) {
      setUploadModalOpen(false);
      router.refresh();
    } else {
      alert(res?.error || "Upload failed");
    }
  };

  const handleAiSummary = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    setAiSummary(null);

    try {
      const res = await summarizePatientHistoryAction(patientId);
      setAiSummary(res);
    } catch (err) {
      setAiSummary({
        summary: "",
        disclaimer: "AI service encountered an issue.",
        error: err instanceof Error ? err.message : "Failed to generate summary",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* AI Summary for Doctor / Admin */}
      {(userRole === "DOCTOR" || userRole === "ADMIN") && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAiSummary}
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        >
          <Sparkles className="h-4 w-4 mr-1 text-indigo-500" />
          AI Clinical Summary
        </Button>
      )}

      {/* Upload Report for Doctor / Admin */}
      {(userRole === "DOCTOR" || userRole === "ADMIN") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUploadModalOpen(true)}
          className="text-slate-700"
        >
          <Upload className="h-4 w-4 mr-1 text-slate-500" />
          Upload Report
        </Button>
      )}

      {/* Book Appointment for Staff & Patient */}
      <Link href={`/appointments/new?patientId=${patientId}`}>
        <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white">
          <Calendar className="h-4 w-4 mr-1" />
          Book Visit
        </Button>
      </Link>

      {/* Modal: Upload Report */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Medical Diagnostic Report</DialogTitle>
            <DialogDescription>
              Attach encrypted document to {patientName}&apos;s file
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label className="text-xs">Report Title</Label>
              <Input
                required
                placeholder="e.g. ECG Trace, Lipid Profile, Ultrasound"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Document File (PDF, PNG, JPG - max 10MB)</Label>
              <Input
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="bg-teal-600 text-white">
                {uploading ? "Uploading..." : "Upload to Private Storage"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: AI Clinical Summary */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="h-5 w-5" />
              AI Clinical Patient Summary
            </DialogTitle>
            <DialogDescription>
              De-identified clinical history for clinician review (Groq Llama-3.3-70B)
            </DialogDescription>
          </DialogHeader>

          {aiLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                Generating structured clinical summary...
              </p>
            </div>
          ) : aiSummary ? (
            <div className="space-y-4">
              {aiSummary.error ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>{aiSummary.error}</span>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {aiSummary.summary}
                </div>
              )}

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{aiSummary.disclaimer}</span>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
