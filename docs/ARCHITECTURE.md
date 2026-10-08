# MediCloud — Architecture & System Design Document

## 1. System Overview
MediCloud is a secure, cloud-native Hospital Management System (HMS) prototype designed for small hospitals and multi-specialty clinics. Built with Next.js App Router, TypeScript, PostgreSQL (via Supabase), Prisma ORM, Auth.js credentials session management, and Groq LLM inference, it provides end-to-end clinical and operational workflow automation.

> **Academic Prototype Notice**: This application operates strictly on synthetic patient data. It is an educational architecture capstone and must not be used as certified clinical software.

---

## 2. Architecture Pattern: Modular Monolith
To prevent microservice fragmentation and distributed transaction failures in clinical settings, MediCloud is architected as a **Modular Monolith**:
- Single unified deployment unit (Vercel Serverless / Node runtime).
- Co-located domain modules (Patient Registry, Outpatient Scheduling, Clinical Encounters, Inpatient Bed Management, Billing, Security & Audit).
- Atomic ACID transactions for multi-step clinical operations using PostgreSQL and Prisma `$transaction`.

```
                    ┌────────────────────────┐
                    │     Web Browsers       │
                    │ (Doctors, Staff, Admin)│
                    └───────────┬────────────┘
                                │ HTTPS
                                ▼
       ┌─────────────────────────────────────────────────┐
       │             Next.js 16 App Router               │
       │                                                 │
       │  ┌────────────────┐      ┌───────────────────┐  │
       │  │ Middleware /   │      │ Server Actions &  │  │
       │  │ Route Guard    │      │ Route Handlers    │  │
       │  └────────┬───────┘      └─────────┬─────────┘  │
       │           │                        │            │
       │  ┌────────▼────────────────────────▼─────────┐  │
       │  │        Domain Services & Utilities        │  │
       │  │ (Auth.js, Zod, pdf-lib, Groq AI SDK)      │  │
       │  └────────────────────┬──────────────────────┘  │
       └───────────────────────┼─────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │  PostgreSQL   │  │ Supabase S3   │  │  Groq Cloud   │
    │  on Supabase  │  │ Storage       │  │  Inference    │
    │  (PgBouncer)  │  │ (Private)     │  │ (Llama-3.3)   │
    └───────────────┘  └───────────────┘  └───────────────┘
```

---

## 3. Technology Stack Justification

| Layer | Technology | Engineering Justification |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Zero-waterfall server rendering, React 19 Server Components, integrated edge routing. |
| **Language** | TypeScript | End-to-end type safety across database schemas, API contracts, and UI components. |
| **Styling** | Tailwind CSS 4 | Zero runtime CSS overhead, accessible teal/slate medical design tokens. |
| **Database** | PostgreSQL 17 (Supabase) | Strict relational integrity, foreign key constraints, ACID compliance. |
| **ORM** | Prisma 6 with `@prisma/adapter-pg` | Type-safe query building with pooling resilience across serverless execution contexts. |
| **Storage** | Supabase Storage (`medical-reports`) | Private S3-compatible object store. Bypassed via server-side service-role; signed URL delivery. |
| **Authentication** | Auth.js (NextAuth v5 beta) | JWT session tokens, bcryptjs (salt rounds 12), rate-limited credential validation. |
| **AI Engine** | Groq Cloud SDK (`llama-3.3-70b`) | Ultra-low latency LLM inference for clinical summarization and symptom routing. |
| **Document Engine**| `pdf-lib` | Serverless-safe binary PDF synthesis for tax invoices and formal prescriptions. |

---

## 4. Database ERD & Relational Model

The database enforces referential constraints and indexes:
- `User`: Central authentication record with role (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`).
- `DoctorProfile`: Clinician specialty, working hours, and consultation rate.
- `Patient`: Demographics, unique Medical Record Number (`MRN`), allergies, and blood group.
- `Appointment`: Doctor-patient-department slot with `@@unique([doctorId, startsAt])` double-booking constraint.
- `Encounter`: Structured clinical note linked 1:1 with an appointment, storing vitals as JSON.
- `Prescription`: Medication line items linked 1:N with an encounter.
- `Bed`: Ward-level inpatient bed allocation with strict state validation (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`).
- `Invoice` & `InvoiceItem`: Server-calculated billing statements with 18% GST.
- `MedicalReport`: Metadata pointer to private cloud storage objects.
- `AuditLog`: Security audit trail capturing actor, entity, action, IP, and event metadata.

---

## 5. Security & Isolation Boundaries
1. **Never Expose Storage Keys**: `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side code.
2. **De-identification Boundary**: The AI pipeline removes MRN, patient name, contact numbers, and email before transmitting data to Groq.
3. **Signed URLs**: Medical documents are fetched via time-limited 300-second presigned URLs after verifying user ownership.
4. **Middleware Protection**: URL-level gate prevents unauthorized cross-role tampering.
