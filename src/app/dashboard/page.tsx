import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "ADMIN":
      redirect("/dashboard/admin");
    case "DOCTOR":
      redirect("/dashboard/doctor");
    case "RECEPTIONIST":
      redirect("/dashboard/reception");
    case "PATIENT":
      redirect("/dashboard/patient");
    default:
      redirect("/login");
  }
}
