# MediCloud — Production & Cloud Deployment Guide

This guide walks through deploying the complete MediCloud application to **Vercel** with **Supabase PostgreSQL & Storage**.

---

## 1. Supabase Cloud Configuration

### 1.1 Project Setup
1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Note your project reference ID and database password.

### 1.2 Database Connection String (Connection Pooling)
Under **Project Settings → Database → Connection string**:
- **Connection pooling mode (Transaction)**: Use Port `6543`.
  ```
  DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&sslaccept=accept_invalid_certs"
  ```
- **Direct connection**: Use Port `6543` or `5432`.
  ```
  DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&sslaccept=accept_invalid_certs"
  ```

### 1.3 Storage Bucket Configuration
1. Go to **Storage → New Bucket**.
2. Name: `medical-reports`
3. Set **Public Bucket: OFF** (Private bucket).
4. Do NOT enable public access. The application server uses `SUPABASE_SERVICE_ROLE_KEY` to upload and issues short-lived (5-minute) signed URLs for authorized viewing.

---

## 2. Environment Variables Configuration

Copy `.env.example` and set the following variables on Vercel:

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | Runtime PostgreSQL connection with pooling | `postgresql://postgres.<ref>:<pass>@...:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Migration connection string | `postgresql://postgres.<ref>:<pass>@...:6543/postgres` |
| `AUTH_SECRET` | 32+ character random secret for JWT signing | `openssl rand -base64 32` |
| `AUTH_URL` | Application root URL | `https://your-domain.vercel.app` (or `http://localhost:3131`) |
| `NEXTAUTH_URL` | Fallback URL for NextAuth v5 | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public API endpoint for Supabase | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin secret key | `sb_secret_...` |
| `SUPABASE_BUCKET` | Storage bucket name | `medical-reports` |
| `GROQ_API_KEY` | Groq AI Cloud API Key | `gsk_...` |
| `GROQ_MODEL` | Fast LLM model identifier | `llama-3.3-70b-versatile` |
| `NEXT_PUBLIC_APP_NAME` | Display branding | `MediCloud HMS` |

---

## 3. Database Schema Migration & Seeding

Run these commands locally or inside your CI/CD runner:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Push Schema to Supabase PostgreSQL
node apply-migration.js

# 3. Seed 40 synthetic patients, 6 doctors, beds, and billing
npm run db:seed
```

---

## 4. Vercel Deployment Steps

1. Install the Vercel CLI or import repository at [vercel.com](https://vercel.com).
2. Configure **Framework Preset**: Next.js.
3. Configure **Build Command**: `npm run build`.
4. Configure **Output Directory**: Next.js default (`.next`).
5. Configure the Environment Variables listed in Section 2.
6. Deploy!

---

## 5. Health Verification

Verify deployment health by querying the unauthenticated status endpoint:
```bash
curl https://your-domain.vercel.app/api/health
```

Expected JSON response (HTTP 200):
```json
{
  "status": "ok",
  "timestamp": "2026-10-08T12:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 6. Troubleshooting
- **Database Connection Error P1001**: Verify port `6543` is specified with `sslmode=require&sslaccept=accept_invalid_certs` when connecting to Supabase AWS connection poolers.
- **Missing AI Results**: Verify `GROQ_API_KEY` starts with `gsk_` and account has active token quotas. The application fails gracefully if the key is absent.
- **Signed URL Errors**: Confirm bucket `medical-reports` exists in Supabase Storage and `SUPABASE_SERVICE_ROLE_KEY` is set in the server environment.
