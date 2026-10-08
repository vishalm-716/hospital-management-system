# MediCloud — Security, Privacy & HIPAA Compliance Architecture

## 1. Compliance Model & Data Protection
MediCloud adheres to international clinical software architectural principles (HIPAA Security Rule, Indian Digital Personal Data Protection Act):
- **Synthetic Data Guarantee**: All patient demographic records, diagnostic reports, and medical notes are 100% synthetically generated.
- **De-identification Pipeline**: All AI workflows strip direct identifiers (MRN, patient name, contact numbers, email, physical address) before submitting prompts to external LLM providers.
- **No Client Secrets**: Cloud storage service-role keys and database connection secrets are strictly isolated to server-side code execution.

---

## 2. Authentication & Session Security
- **Algorithm**: Password hashing via `bcryptjs` with salt rounds 12.
- **Session Tokens**: Tamper-proof JSON Web Tokens (JWT) signed via `AUTH_SECRET` (256-bit entropy).
- **Brute-Force & Enumeration Mitigation**:
  - In-memory rate limiting applied to login and registration requests (5 attempts per minute).
  - Constant-time password validation logic prevents timing attacks.
  - Generic authentication error messages ("Invalid email or password") prevent account enumeration.
- **Inactive Staff Blocking**: Account access is immediately revoked upon administrator deactivation without waiting for session expiry.

---

## 3. Storage Security & Access Control
- **Private Supabase Bucket**: Bucket `medical-reports` is strictly private (RLS enabled, public read disabled).
- **Service Role Upload**: Document ingestion runs through protected server actions utilizing `SUPABASE_SERVICE_ROLE_KEY`.
- **Signed URL Delivery**: Medical report downloads are generated with short-lived presigned URLs (300-second expiry) issued only after verifying the user's role and patient data relationship.
- **MIME & File Verification**: Ingested files are restricted to `application/pdf`, `image/png`, `image/jpeg` with an upper bound of 10MB. File extensions are cryptographically randomized to prevent path traversal attacks.

---

## 4. Comprehensive Audit Logging
Every sensitive clinical transaction records an entry in the PostgreSQL `AuditLog` table:
- Patient record reads and searches
- Clinical encounter creations and edits
- Prescription creations
- Medical report signed URL accesses
- Bed assignments and discharges
- Invoices issued and payment settlements
- Staff account status modifications

---

## 5. Defense-in-Depth Authorization
Authorization is enforced at multiple layers:
1. **Edge Middleware**: Blocks unauthorized routes based on role before page rendering.
2. **Server Actions & Route Handlers**: Re-validates the session token, user identity, and entity permissions before executing database mutations.
3. **Database Constraints**: Prevents double-booking via unique compound indexes (`@@unique([doctorId, startsAt])`).
