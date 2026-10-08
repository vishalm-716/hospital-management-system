"use server";

import { signIn, signOut } from "@/lib/auth";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations";
import { generateMRN } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { AuthError } from "next-auth";

export async function loginAction(
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = loginSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || "Invalid input" };
  }

  try {
    await signIn("credentials", {
      email: data.email.toLowerCase(),
      password: data.password,
      redirect: false,
    });
    return { error: "" };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password" };
      }
      if (error.cause?.err?.message) {
        return { error: error.cause.err.message };
      }
    }
    return { error: "Invalid email or password" };
  }
}

export async function registerAction(
  _prevState: { error: string; success: boolean } | undefined,
  formData: FormData
) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    phone: (formData.get("phone") as string) || undefined,
    dateOfBirth: formData.get("dateOfBirth") as string,
    gender: formData.get("gender") as string,
  };

  const validated = registerSchema.safeParse(data);
  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid input",
      success: false,
    };
  }

  try {
    // Check if email exists (but don't reveal this to the user)
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      // Generic message to prevent email enumeration
      return { error: "Registration failed. Please try again or contact support.", success: false };
    }

    const passwordHash = await hash(data.password, 12);
    const mrn = generateMRN();

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: "PATIENT",
          phone: data.phone,
        },
      });

      await tx.patient.create({
        data: {
          userId: user.id,
          mrn,
          name: data.name,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender as "MALE" | "FEMALE" | "OTHER",
          phone: data.phone || "",
          email: data.email.toLowerCase(),
        },
      });

      await createAuditLog({
        userId: user.id,
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
      });
    });

    return { error: "", success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Registration failed. Please try again.", success: false };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
