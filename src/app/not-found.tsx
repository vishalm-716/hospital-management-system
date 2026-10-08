import React from "react";
import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="login-page">
      <div className="login-center">
        <div className="login-box" style={{ textAlign: "center" }}>
          <div className="login-logo-icon" style={{ margin: "0 auto 1.5rem" }}>
            <Activity />
          </div>

          <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem" }}>
            404
          </h1>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--teal-300)", marginBottom: "0.5rem" }}>
            Clinical Resource Not Found
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--slate-400)", marginBottom: "2rem", lineHeight: 1.6 }}>
            The requested medical record, portal view, or patient route does not exist or has been moved.
          </p>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button className="login-submit-btn" style={{ maxWidth: "240px", margin: "0 auto" }}>
              <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
              <span>Return to Dashboard</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
