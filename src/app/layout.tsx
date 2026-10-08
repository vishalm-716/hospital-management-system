import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediCloud HMS — Secure Cloud Hospital Management System",
  description:
    "Next-generation hospital management system prototype with electronic health records, AI triage, clinical summaries, and role-based access control.",
  keywords: "hospital management, EHR, clinical AI, triage, appointment scheduling, medical records",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ minHeight: "100%", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
