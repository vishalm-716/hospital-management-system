# MediCloud HMS — Secure Cloud Hospital Management System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq-Llama--3.3--70B-orange)](https://groq.com/)
[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen?logo=githubactions)](https://github.com/)

> **ACADEMIC PROTOTYPE NOTICE**: MediCloud is an academic and technical architecture capstone prototype utilizing synthetic patient records only. It must not be deployed as certified clinical software or used for actual medical treatment decisions.

---

## 1. Project Overview & Problem Statement
Small hospitals, clinics, and multi-specialty polyclinics in India face significant operational hurdles:
- **Disjointed systems**: Paper prescriptions, separate spreadsheet billing, and lost paper lab reports.
- **Clinician fatigue**: Physicians spend valuable time reviewing disorganized physical files rather than consulting patients.
- **Double-booking & scheduling chaos**: High patient wait times and double-booked doctor appointments.

**MediCloud** solves this by unifying outpatient scheduling, electronic health records (EHR), clinical encounters, inpatient bed management, automated GST billing, and AI clinical summarization into a single modular cloud application.

---

## 2. Core Features by Role

### 👑 Administrator (`ADMIN`)
- **Executive KPI Dashboard**: Live outpatient count, appointments today, monthly revenue in Indian Rupees (₹), and bed occupancy percentage.
- **Interactive Analytics**: 7-day consultation trends and department visit distribution powered by Recharts.
- **Staff Directory**: Activate/deactivate medical staff accounts and onboard doctors with department and fee configurations.
- **Security Audit Trail**: Real-time filterable log of clinical records reads, writes, and authentication events.

### 🩺 Doctor (`DOCTOR`)
- **Today's Consultation Queue**: Real-time OPD patient list with status tracking (Waiting, In Consultation, Completed).
- **Electronic Health Encounters**: Record chief complaints, clinical diagnosis, notes, and structured vitals (BP, Pulse, Temp, SpO2, Weight).
- **Digital Prescriptions (Rx)**: Create structured medication regimens and download server-rendered official prescription PDFs.
- **AI Clinical Patient History Summary**: Instant Groq LLM summary of de-identified patient encounters and active medications.
- **Encrypted Document Upload**: Upload lab investigations directly to private cloud storage.

### 📋 Receptionist (`RECEPTIONIST`)
- **Master Patient Index**: Fast live search across patient names, contact numbers, and unique Medical Record Numbers (MRN).
- **OPD Scheduling**: Available-slot picker based on clinician working hours and existing bookings (with double-booking protection).
- **Patient Arrival Check-in**: One-click status progression to `CHECKED_IN`.
- **AI Symptom Triage**: Suggests appropriate clinical department and urgency rating (`LOW`, `MEDIUM`, `HIGH`) for walk-in arrivals.
- **GST Billing & Invoicing**: Automated line-item tax calculation (18% GST) and payment settlement (UPI, Card, Cash, Insurance).

### 👤 Patient (`PATIENT`)
- **Self-Service Health Portal**: View complete health profile, MRN, documented allergies, and emergency contacts.
- **Visit History**: Review past and upcoming consultations with the ability to cancel eligible visits.
- **Prescription & Invoice Downloads**: Instant access to downloadable prescription and tax invoice PDFs.
- **Diagnostic Reports**: Access private lab test reports through secure 5-minute signed URLs.

---

## 3. Technology Stack & Cloud Architecture

```
                  Client Layer (Desktop, Tablet, Mobile)
                                    │
                                    ▼
       Next.js 16 App Router (Modular Monolith on Vercel)
         ├── Middleware Role-Based Route Gate
         ├── Server Actions with Zod Validation
         ├── Auth.js Credentials Authentication (JWT Sessions)
         ├── PDF Generation via pdf-lib
         └── De-identification Pipeline
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     ▼                              ▼                              ▼
PostgreSQL 17              Supabase Storage                Groq Cloud SDK
(Supabase Connection Pool) (Private Bucket)              (Llama-3.3-70B Inference)
- Strict Foreign Keys      - Private 'medical-reports'   - De-identified Summaries
- Double-Booking Locks     - Service-role uploads        - Real-time Symptom Triage
- Indexed Audit Trails     - 300s presigned view URLs    - Fallback Error Handling
```

---

## 4. Database Schema Design (Prisma ORM)

The relational schema includes indexed entities and constraints:
- `User`: Central account records with roles (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`) and active flags.
- `DoctorProfile`: Clinician specialty, consultation rate, slot duration, and working schedules.
- `Patient`: Unique Medical Record Number (`MRN`), contact details, blood group, and allergies.
- `Appointment`: Doctor-patient consultation slot with **`@@unique([doctorId, startsAt])`** compound constraint.
- `Encounter`: 1:1 clinical encounter note storing physiological vitals as structured JSON.
- `Prescription`: Medication instructions linked to clinical encounters.
- `Bed`: Grouped by ward (`General Ward A/B`, `ICU`, `Pediatric`, `Post-Op`) with occupancy states.
- `Invoice` & `InvoiceItem`: Financial statements with server-side totals and 18% GST calculation.
- `MedicalReport`: Metadata pointer to private cloud storage objects.
- `AuditLog`: Security compliance ledger recording actor, action, entity, timestamp, IP, and metadata.

---

## 5. Local Setup & Execution Guide

### 5.1 Prerequisites
- Node.js 20.x or 22.x
- npm 10.x+

### 5.2 Installation
```bash
# Clone the repository and navigate into the workspace
git clone <repo-url>
cd medicloud

# Install dependencies
npm install --legacy-peer-deps
```

### 5.3 Required Environment Variables
Create a `.env` file based on `.env.example`. Only variable names are listed below (never commit actual secrets):

| Variable Name | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pool URL (Supabase/PgBouncer, Node.js runtime) |
| `DIRECT_URL` | Direct PostgreSQL connection string for Prisma migrations |
| `AUTH_SECRET` | 32+ character random secret for JWT encryption |
| `AUTH_URL` | Local (`http://localhost:3131`) or Production URL (`https://YOUR_VERCEL_DOMAIN`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Supabase service role key (server-side only) |
| `SUPABASE_BUCKET` | Cloud storage bucket name (e.g. `medical-reports`) |
| `GROQ_API_KEY` | Groq Cloud API key for clinical AI inference |
| `GROQ_MODEL` | Groq model identifier (e.g. `llama-3.3-70b-versatile`) |
| `NEXT_PUBLIC_APP_NAME` | Application name branding (e.g. `MediCloud HMS`) |

### 5.4 Database Setup & Migration
```bash
# Generate the Prisma Client
npx prisma generate

# Apply schema migrations to Supabase PostgreSQL (safe, non-destructive)
npx prisma migrate deploy

# Seed synthetic demo data (optional for local/demo evaluation only)
npx tsx prisma/seed.ts
```

### 5.5 Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3131](http://localhost:3131)** in your browser.

---

## 6. Security Architecture & Notes

- **Password Security**: Strong hashing with `bcryptjs` salt rounds; passwords never stored or logged in plaintext.
- **Strict Role-Based Access Control (RBAC)**: Enforced both at the Next.js edge proxy/middleware layer and within individual server actions using session validation.
- **Server-Side Authorization**: Patients can only inspect their own records; doctors cannot view administrative system logs; receptionists are locked from clinical encounter notes.
- **No Secret Leaks**: All private credentials (`SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `DATABASE_URL`) are isolated to Node.js server runtimes and excluded from client bundles and health endpoints.
- **Private Presigned Object Storage**: Medical files are strictly private; clients access them exclusively via short-lived (300-second) cryptographic presigned URLs generated on demand.
- **De-identification**: Patient personal data (names, phone numbers, addresses, MRNs) is removed prior to Groq AI inference.

---

## 7. Cloud Deployment Guide (Vercel)

1. Connect the GitHub repository `vishalm-716/hospital-management-system` to Vercel.
2. Select **Next.js** framework preset.
3. Configure Production Environment Variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` (Set to `https://YOUR_VERCEL_DOMAIN.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
   - `NEXT_PUBLIC_APP_NAME`
4. Deploy the project. The build automatically triggers `prisma generate` via `package.json` build hook.
5. Apply database schema to Supabase:
   ```bash
   npx prisma migrate deploy
   ```
6. Safe synthetic seed (only when authorized for presentations):
   ```bash
   npx tsx prisma/seed.ts
   ```

---

## 8. Demo Credentials

All test accounts share the common password:
**`Demo@123`**

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@medicloud.demo` | `Demo@123` |
| **Doctor** | `doctor@medicloud.demo` | `Demo@123` |
| **Receptionist** | `reception@medicloud.demo` | `Demo@123` |
| **Patient** | `patient@medicloud.demo` | `Demo@123` |

---

## 9. Quality Assurance & Verification Commands

All checks pass with zero errors:
```bash
# 1. TypeScript Strict Typecheck
npm run typecheck

# 2. ESLint Validation
npm run lint

# 3. Production Build Compilation
npm run build
```

---

## 10. AI Capabilities & Limitations

### Capabilities
- **Clinical History Summaries**: Extracts key findings, recent consultations, medication lists, and points for clinician review.
- **Symptom Triage Routing**: Recommends appropriate medical departments and urgency levels (`LOW`, `MEDIUM`, `HIGH`) for front desk routing.
- **PII Protection**: Direct identifiers (MRN, name, phone, address, email) are stripped prior to LLM submission.

### Limitations & Clinical Boundaries
- **Not Medical Advice**: AI features are labeled with mandatory clinical disclaimers. Output is purely advisory and must not be used as a primary diagnostic tool.
- **No Direct Browser Invocations**: All AI requests originate from server actions using protected API keys.
- **Graceful Degradation**: If `GROQ_API_KEY` is missing, expired, or throttled, the application returns a clear user-facing warning without breaking other clinical operations.

---

## 11. Cloud Services & Architecture Rationale
- **Supabase PostgreSQL 17**: Scalable managed database with robust relational integrity and connection pooling via PgBouncer.
- **Supabase Storage**: Private S3-compatible cloud object storage for diagnostic imaging and lab PDFs.
- **Groq Cloud API**: High-speed LLM inference running Llama-3.3-70B for real-time triage and summarization.
- **Vercel Serverless Platform**: Fast edge routing and automatic HTTPS certificate provisioning.

---

## 12. Future Scope & Roadmap
1. **ABDM Integration**: Ayushman Bharat Health Account (ABHA) creation and Indian health data interoperability.
2. **Automated Reminders**: WhatsApp and SMS appointment confirmation and medicine adherence alerts.
3. **Telemetry & PACS Integration**: Direct DICOM viewer embedding for X-Rays, MRIs, and CT scans.
4. **Offline Resilience**: Progressive Web App (PWA) offline queuing for rural clinic connectivity drops.
