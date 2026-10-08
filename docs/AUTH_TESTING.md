# MediCloud HMS — Authentication & RBAC Verification Guide

## 1. Role-Based Access Control (RBAC) Matrix

| Portal / Route | ADMIN | DOCTOR | RECEPTIONIST | PATIENT | Unauthenticated |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/login` | Redirect to `/dashboard` | Redirect to `/dashboard` | Redirect to `/dashboard` | Redirect to `/dashboard` | Allowed (200) |
| `/register` | Redirect to `/dashboard` | Redirect to `/dashboard` | Redirect to `/dashboard` | Redirect to `/dashboard` | Allowed (200) |
| `/dashboard` | Redirect to `/dashboard/admin` | Redirect to `/dashboard/doctor` | Redirect to `/dashboard/reception` | Redirect to `/dashboard/patient` | Redirect to `/login` |
| `/dashboard/admin` | **ALLOW** | 403 / Redirect | 403 / Redirect | 403 / Redirect | Redirect to `/login` |
| `/dashboard/doctor` | **ALLOW** | **ALLOW** | 403 / Redirect | 403 / Redirect | Redirect to `/login` |
| `/dashboard/reception` | **ALLOW** | 403 / Redirect | **ALLOW** | 403 / Redirect | Redirect to `/login` |
| `/dashboard/patient` | **ALLOW** | 403 / Redirect | 403 / Redirect | **ALLOW** (Own data) | Redirect to `/login` |
| `/patients` | **ALLOW** | **ALLOW** | **ALLOW** | 403 / Redirect | Redirect to `/login` |
| `/patients/[id]` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** (Self only) | Redirect to `/login` |
| `/appointments` | **ALLOW** | **ALLOW** (Roster) | **ALLOW** (All) | **ALLOW** (Own appts) | Redirect to `/login` |
| `/billing` | **ALLOW** | 403 / Redirect | **ALLOW** | **ALLOW** (Own invoices) | Redirect to `/login` |
| `/beds` | **ALLOW** | 403 / Redirect | **ALLOW** | 403 / Redirect | Redirect to `/login` |
| `/audit-logs` | **ALLOW** | 403 / Redirect | 403 / Redirect | 403 / Redirect | Redirect to `/login` |
| `/settings` | **ALLOW** | 403 / Redirect | 403 / Redirect | 403 / Redirect | Redirect to `/login` |
| `/api/health` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** (Public) |

---

## 2. Demo Credentials (Synthetic Test Users)

* **Admin**: `admin@medicloud.demo` / `Demo@123`
* **Doctor**: `doctor@medicloud.demo` / `Demo@123`
* **Receptionist**: `reception@medicloud.demo` / `Demo@123`
* **Patient**: `patient@medicloud.demo` / `Demo@123`

---

## 3. Automated RBAC Test Script

Run the automated acceptance suite verifying all roles, bcrypt passwords, double-booking queries, and DB constraints:

```bash
npx tsx scripts/verify-acceptance.ts
```

---

## 4. Manual Verification Checklist

1. [x] **Login Page**:
   - One-click demo credential pills populate email and password correctly.
   - Submitting invalid credentials shows a generic "Invalid email or password" error to prevent email enumeration.
   - Deactivated users (`isActive: false`) receive an explicit deactivation notice and cannot authenticate.
2. [x] **Session Persistence**:
   - Auth.js JWT session cookie persists across page refresh.
   - Navigating to `/login` while logged in immediately redirects to `/dashboard`.
3. [x] **Sign Out**:
   - Clicking "Sign Out" in the sidebar executes `signOut({ redirectTo: "/login" })`, clearing session cookies.
4. [x] **Patient Boundary Enforcement**:
   - Patient role attempting to book an appointment for another patient MRN is blocked at the server action level (`createAppointmentAction`).
   - Patient attempting to view medical report PDFs or sign URLs of other patients is blocked via user-session ownership verification in `getReportSignedUrlAction`.
5. [x] **Admin Boundary Enforcement**:
   - Non-admin accessing `/audit-logs` or `/settings` is redirected to `/dashboard`.
   - Modifying staff status is restricted strictly to `ADMIN` role in `toggleStaffStatusAction`.
