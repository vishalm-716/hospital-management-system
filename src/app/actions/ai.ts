"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generatePatientSummary, triageSymptoms } from "@/lib/groq";
import { triageSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function summarizePatientHistoryAction(patientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only clinicians may request AI clinical summaries");
  }

  // Fetch clinical encounters stripped of personal identifiers
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      allergies: true,
      encounters: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          prescriptions: true,
        },
      },
    },
  });

  if (!patient) throw new Error("Patient not found");

  // De-identify: format encounters with NO names, phone numbers, addresses, or MRNs
  const deidentifiedEncounters = patient.encounters.map((enc) => ({
    date: enc.createdAt.toLocaleDateString("en-IN"),
    symptoms: enc.symptoms,
    diagnosis: enc.diagnosis,
    notes: enc.notes,
    vitals: enc.vitals,
    prescriptions: enc.prescriptions.map((p) => ({
      medicine: p.medicine,
      dosage: p.dosage,
      frequency: p.frequency,
      durationDays: p.durationDays,
    })),
  }));

  const result = await generatePatientSummary(
    deidentifiedEncounters,
    patient.allergies
  );

  await createAuditLog({
    userId: session.user.id,
    action: "GENERATE_AI_HISTORY_SUMMARY",
    entity: "Patient",
    entityId: patientId,
    metadata: { encounterCount: deidentifiedEncounters.length },
  });

  return {
    summary: result.summary,
    error: result.error,
    disclaimer:
      "⚠️ AI Assistance Only — Not Clinical Medical Advice. All clinical decisions and treatment plans must be validated independently by a licensed healthcare professional.",
  };
}

export async function triageSymptomsAction(formData: FormData) {
  const rawData = {
    symptoms: formData.get("symptoms") as string,
    age: formData.get("age") ? Number(formData.get("age")) : undefined,
    gender: (formData.get("gender") as string) || undefined,
  };

  const parsed = triageSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      department: "",
      urgency: "MEDIUM" as const,
      reasoning: "",
      error: parsed.error.errors[0]?.message || "Validation failed",
      disclaimer: "AI Assistance Only — Not Medical Advice.",
    };
  }

  // Fetch current hospital departments for routing
  const depts = await prisma.department.findMany({ select: { name: true } });
  const deptNames = depts.map((d) => d.name);

  const result = await triageSymptoms(
    parsed.data.symptoms,
    parsed.data.age,
    parsed.data.gender,
    deptNames
  );

  return {
    department: result.department,
    urgency: result.urgency,
    reasoning: result.reasoning,
    error: result.error,
    disclaimer:
      "⚠️ Triage Guidance Only — Not a Diagnosis or Clinical Advice. For immediate emergencies, call emergency services (112 / 108) or visit the nearest emergency room immediately.",
  };
}
