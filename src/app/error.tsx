"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MediCloud Runtime Application Error:", error);
  }, [error]);

  return (
    <div className="login-page">
      <div className="login-center">
        <div className="login-box" style={{ textAlign: "center" }}>
          <div
            className="login-logo-icon"
            style={{
              margin: "0 auto 1.5rem",
              background: "rgba(244, 63, 94, 0.15)",
              color: "var(--rose-400)",
              borderColor: "rgba(244, 63, 94, 0.3)",
            }}
          >
            <AlertTriangle />
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem" }}>
            Application Error
          </h1>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--rose-400)", marginBottom: "0.75rem" }}>
            Encountered an Unexpected Clinical Portal Issue
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--slate-400)", marginBottom: "2rem", lineHeight: 1.6 }}>
            {error?.message || "An unexpected error occurred while processing the request. Security & RLS boundaries remain intact."}
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              className="login-submit-btn"
              style={{
                maxWidth: "180px",
                background: "linear-gradient(135deg, var(--teal-600), var(--teal-500))",
              }}
            >
              <RefreshCw style={{ width: "1rem", height: "1rem" }} />
              <span>Retry</span>
            </button>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <button
                className="btn btn-secondary"
                style={{
                  height: "100%",
                  padding: "0.6875rem 1.25rem",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <Home style={{ width: "1rem", height: "1rem" }} />
                <span>Dashboard</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
