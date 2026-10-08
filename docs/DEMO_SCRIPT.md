# MediCloud — Evaluator Demo Script & Walkthrough

This step-by-step walkthrough enables hackathon judges and evaluators to test all 4 system roles and core clinical features in **under 7 minutes**.

---

## Demo Credentials Reference
All accounts share the standard evaluation password:
**`Demo@123`**

| Role | Email | Key Capabilities to Showcase |
| :--- | :--- | :--- |
| **Admin** | `admin@medicloud.demo` | Executive KPIs, charts, staff activation, audit trail |
| **Doctor** | `doctor@medicloud.demo` | OPD queue, clinical encounter, Rx PDF, AI summary |
| **Receptionist** | `reception@medicloud.demo` | Patient search, slot booking, check-in, AI triage, billing |
| **Patient** | `patient@medicloud.demo` | Portal view, past visits, download Rx & invoice PDFs |

---

## 1. Scenario 1: Executive Oversight (Admin Role)
1. Navigate to `/login`. Click the **👑 Admin** quick button.
2. Observe the **Executive Overview**:
   - 4 KPI cards: Patients Today, Appointments Today, Revenue This Month, Bed Occupancy.
   - Interactive charts: 7-Day Appointment Trend and Department Distribution.
3. Click **Audit Logs** in top-right or sidebar:
   - Filter logs by Entity (e.g. `Patient` or `Encounter`).
   - Notice immutable records of reads and writes with timestamps.
4. Click **Settings & Staff** in sidebar:
   - Toggle a staff member's account to **Deactivated** and verify status badge updates.

---

## 2. Scenario 2: Front Desk & Walk-In Patient (Receptionist Role)
1. Sign out and log in as **📋 Receptionist** (`reception@medicloud.demo`).
2. Test **Patient Master Index Search**:
   - Type `"Rohan"` or `"MRN-SYNTH-1001"`. Notice instant matching results.
3. Test **AI Symptom Triage**:
   - Click **AI Symptom Triage Helper** in right quick-action card.
   - Enter: `"Severe chest tightness, radiating left arm pain, sweating"`, Age: `54`.
   - Click **Analyze Symptoms**.
   - Notice the response: Suggests **Cardiology** with **HIGH URGENCY**, brief clinical reasoning, and mandatory safety disclaimer.
4. Check-in a scheduled patient:
   - Locate an appointment with `SCHEDULED` status and click **Check In**.
   - The status updates immediately to `CHECKED_IN`.

---

## 3. Scenario 3: Doctor Consultation & AI Intelligence (Doctor Role)
1. Sign out and log in as **🩺 Doctor** (`doctor@medicloud.demo`).
2. View **Today's Consultation Queue**:
   - Notice status pills (Waiting, In Consultation, Completed).
3. Test **AI Clinical Patient Summary**:
   - Click **AI Summary** button next to a patient.
   - Groq inference generates structured clinical history sections (Relevant History, Recent Encounters, Medications, Allergies, Points for Clinician Review) with all PII de-identified.
4. Conduct Consultation:
   - Click **Consult**.
   - Review and adjust vitals (BP, Pulse, SpO2), chief complaints, and diagnosis.
   - Add a prescription medicine, frequency, and duration.
   - Click **Finalize Consultation & Generate Rx**.
5. Download PDF:
   - Click **Rx PDF** and view the newly generated, server-rendered prescription document.

---

## 4. Scenario 4: Patient Self-Service Portal (Patient Role)
1. Sign out and log in as **👤 Patient** (`patient@medicloud.demo`).
2. Observe the patient's personal health portal:
   - View MRN, blood group, and allergy warnings.
   - Switch tabs to **Prescriptions & Clinical History** and click **Download Prescription PDF**.
   - Switch tabs to **Diagnostic Reports** and click **View Signed Document** (tests secure signed storage delivery).
   - Switch tabs to **Billing & Receipts** and download official tax invoice PDF with 18% GST calculation.
3. Test Self-Booking:
   - Click **Book New Appointment**.
   - Pick Specialty, Doctor, Date, and available slot. Confirm booking.
