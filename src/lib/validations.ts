import { z } from "zod";

// ─── Auth Schemas ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits").optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

// ─── Patient Schemas ───────────────────────────────────────────────

export const patientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

// ─── Appointment Schemas ───────────────────────────────────────────

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  departmentId: z.string().min(1, "Department is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  reason: z.string().min(2, "Reason is required"),
  notes: z.string().optional(),
});

// ─── Encounter Schemas ─────────────────────────────────────────────

export const encounterSchema = z.object({
  appointmentId: z.string().min(1, "Appointment is required"),
  symptoms: z.string().min(2, "Symptoms are required"),
  diagnosis: z.string().min(2, "Diagnosis is required"),
  notes: z.string().optional(),
  vitals: z.object({
    bp: z.string().optional(),
    pulse: z.string().optional(),
    temp: z.string().optional(),
    spo2: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
  prescriptions: z.array(z.object({
    medicine: z.string().min(1, "Medicine name is required"),
    dosage: z.string().min(1, "Dosage is required"),
    frequency: z.string().min(1, "Frequency is required"),
    durationDays: z.number().min(1, "Duration must be at least 1 day"),
    instructions: z.string().optional(),
  })).optional(),
});

// ─── Invoice Schemas ───────────────────────────────────────────────

export const invoiceSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  appointmentId: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
  })).min(1, "At least one item is required"),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "INSURANCE", "OTHER"]),
});

// ─── Bed Schemas ───────────────────────────────────────────────────

export const bedAssignSchema = z.object({
  bedId: z.string().min(1, "Bed is required"),
  patientId: z.string().min(1, "Patient is required"),
});

export const bedStatusSchema = z.object({
  bedId: z.string().min(1, "Bed is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]),
});

// ─── Department Schemas ────────────────────────────────────────────

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  description: z.string().optional(),
});

// ─── User Management Schemas ───────────────────────────────────────

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"]),
  phone: z.string().optional(),
});

// ─── AI Schemas ────────────────────────────────────────────────────

export const triageSchema = z.object({
  symptoms: z.string().min(5, "Please describe symptoms in detail"),
  age: z.number().min(0).max(150).optional(),
  gender: z.string().optional(),
});

// ─── Report Upload Schema ──────────────────────────────────────────

export const reportUploadSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  title: z.string().min(2, "Report title is required"),
});
