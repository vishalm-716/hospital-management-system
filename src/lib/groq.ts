import Groq from "groq-sdk";
import { checkRateLimit } from "@/lib/utils";

/**
 * Initialize Groq client with server-side API key.
 * Never call this from client-side code.
 */
function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ_API_KEY not set. AI features will be unavailable.");
    return null;
  }
  return new Groq({ apiKey });
}

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

/**
 * Generate a patient history summary for a doctor.
 * De-identifies patient data before sending to AI.
 * 
 * @param encounters - Patient clinical encounters (pre-stripped of PII)
 * @param allergies - Known allergies
 */
export async function generatePatientSummary(
  encounters: Array<{
    date: string;
    symptoms: string;
    diagnosis: string;
    notes?: string | null;
    vitals?: unknown;
    prescriptions: Array<{
      medicine: string;
      dosage: string;
      frequency: string;
      durationDays: number;
    }>;
  }>,
  allergies?: string | null
): Promise<{ summary: string; error: string | null }> {
  const groq = getGroqClient();
  if (!groq) {
    return {
      summary: "",
      error: "AI service is not configured. Please set GROQ_API_KEY.",
    };
  }

  // Rate limit AI requests
  const rateLimit = checkRateLimit("ai:summary", 20, 60000);
  if (!rateLimit.allowed) {
    return { summary: "", error: "Too many AI requests. Please try again later." };
  }

  try {
    // Build de-identified clinical context (no name, phone, address, MRN, email)
    const clinicalContext = encounters
      .map(
        (e, i) =>
          `Encounter ${i + 1} (${e.date}):
Symptoms: ${e.symptoms}
Diagnosis: ${e.diagnosis}
Notes: ${e.notes || "None"}
Vitals: ${e.vitals ? JSON.stringify(e.vitals) : "Not recorded"}
Medications: ${e.prescriptions.map((p) => `${p.medicine} ${p.dosage} ${p.frequency} for ${p.durationDays} days`).join("; ") || "None"}`
      )
      .join("\n\n");

    const prompt = `You are a clinical assistant. Summarize the following de-identified patient clinical history for a reviewing physician. Do NOT include any patient identifying information.

Known Allergies: ${allergies || "None reported"}

Clinical History:
${clinicalContext}

Provide the summary in these sections:
1. **Relevant History**: Key findings and patterns
2. **Recent Encounters**: Summary of most recent visits
3. **Current Medications**: Active medication regimen
4. **Allergies & Alerts**: Known allergies and safety concerns
5. **Points for Review**: Items requiring clinician attention

Keep it concise and clinically relevant.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 1024,
    });

    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      return { summary: "", error: "AI returned an empty response." };
    }

    return { summary, error: null };
  } catch (error) {
    console.error("Groq API error:", error);
    if (error instanceof Error) {
      if (error.message.includes("rate_limit")) {
        return { summary: "", error: "AI rate limit exceeded. Try again in a moment." };
      }
      if (error.message.includes("timeout")) {
        return { summary: "", error: "AI request timed out. Please try again." };
      }
    }
    return { summary: "", error: "AI service encountered an error. Please try again." };
  }
}

/**
 * Symptom triage helper.
 * Returns suggested department, urgency, and reasoning.
 * Clearly labeled as AI assistance only — not medical advice.
 */
export async function triageSymptoms(
  symptoms: string,
  age?: number,
  gender?: string,
  departments?: string[]
): Promise<{
  department: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  error: string | null;
}> {
  const groq = getGroqClient();
  if (!groq) {
    return {
      department: "",
      urgency: "MEDIUM",
      reasoning: "",
      error: "AI service is not configured. Please set GROQ_API_KEY.",
    };
  }

  // Rate limit AI requests
  const rateLimit = checkRateLimit("ai:triage", 30, 60000);
  if (!rateLimit.allowed) {
    return {
      department: "",
      urgency: "MEDIUM",
      reasoning: "",
      error: "Too many AI requests. Please try again later.",
    };
  }

  try {
    const deptList = departments?.length
      ? departments.join(", ")
      : "General Medicine, Cardiology, Orthopedics, Pediatrics, Dermatology, ENT";

    const prompt = `You are a medical triage assistant. Based on the symptoms provided, suggest the most appropriate department and urgency level. This is for routing purposes only — NOT a diagnosis or medical advice.

Symptoms: ${symptoms}
${age ? `Age: ${age}` : ""}
${gender ? `Gender: ${gender}` : ""}

Available departments: ${deptList}

Respond in this exact JSON format only:
{
  "department": "Department Name",
  "urgency": "LOW" or "MEDIUM" or "HIGH",
  "reasoning": "Brief explanation for the routing suggestion (2-3 sentences)"
}

Rules:
- LOW: Non-urgent, can wait for regular appointment
- MEDIUM: Should be seen within 24-48 hours
- HIGH: Needs prompt attention (not emergency — direct to ER if life-threatening)
- Do NOT diagnose or prescribe
- Keep reasoning brief and factual`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 256,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return {
        department: "",
        urgency: "MEDIUM",
        reasoning: "",
        error: "AI returned an empty response.",
      };
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        department: "",
        urgency: "MEDIUM",
        reasoning: content,
        error: "AI returned a malformed response.",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const urgency = ["LOW", "MEDIUM", "HIGH"].includes(parsed.urgency)
      ? parsed.urgency
      : "MEDIUM";

    return {
      department: parsed.department || "",
      urgency: urgency as "LOW" | "MEDIUM" | "HIGH",
      reasoning: parsed.reasoning || "",
      error: null,
    };
  } catch (error) {
    console.error("Groq triage error:", error);
    return {
      department: "",
      urgency: "MEDIUM",
      reasoning: "",
      error: "AI service encountered an error. Please try again.",
    };
  }
}
