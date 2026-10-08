"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  breadcrumb?: string;
}

export function Navbar({ userName, userRole, breadcrumb }: NavbarProps) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    return { href, label, isLast: idx === segments.length - 1 };
  });

  return (
    <header className="navbar">
      <nav className="navbar-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">Home</Link>
        {breadcrumbItems.map((item) => (
          <React.Fragment key={item.href}>
            <span>›</span>
            {item.isLast ? (
              <span className="current">{item.label}</span>
            ) : (
              <Link href={item.href}>{item.label}</Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="navbar-right">
        <div className="navbar-badge" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", color: "#065f46" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>RLS &amp; HIPAA Compliant (Prototype)</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "0.75rem", borderLeft: "1px solid var(--slate-200)" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--slate-800)" }}>{userName || "Medical Staff"}</p>
            <p style={{ fontSize: "0.6875rem", color: "var(--teal-600)", fontWeight: 500 }}>{userRole || "User"}</p>
          </div>
          <div style={{
            height: "2rem", width: "2rem", borderRadius: "9999px",
            background: "var(--teal-600)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.75rem", boxShadow: "var(--shadow-sm)"
          }}>
            {userName ? userName.charAt(0).toUpperCase() : "M"}
          </div>
        </div>
      </div>
    </header>
  );
}
