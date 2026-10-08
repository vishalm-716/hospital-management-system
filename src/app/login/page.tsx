"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await loginAction(undefined, formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const setDemoCreds = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Demo@123");
    setError("");
  };

  return (
    <div className="login-page">
      {/* Demo Banner */}
      <div className="demo-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <strong>ACADEMIC PROTOTYPE ONLY:</strong> All patient records, clinical data, and medical profiles shown are synthetic. Not for certified clinical or production medical use.
      </div>

      <div className="login-center">
        <div className="login-box">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <Activity />
            </div>
            <h1 className="login-title">
              MediCloud
              <span style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "var(--teal-400)",
                background: "var(--teal-950)",
                border: "1px solid var(--teal-800)",
                padding: "0.15rem 0.5rem",
                borderRadius: "var(--radius-sm)"
              }}>HMS</span>
            </h1>
            <p className="login-subtitle">Secure Cloud Hospital Management &amp; Clinical Intelligence</p>
          </div>

          {/* Card */}
          <div className="login-card">
            <div className="login-card-header">
              <h2 className="login-card-title">Sign In to Portal</h2>
              <p className="login-card-desc">Enter your hospital credentials to access your portal</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="login-card-body">
                {error && (
                  <div className="login-error">
                    <ShieldAlert />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="email" style={{ color: "var(--slate-300)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", display: "block" }}>
                    Email Address
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon"><Mail /></span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@medicloud.demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input input-dark"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="password" style={{ color: "var(--slate-300)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", display: "block" }}>
                    Password
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon"><Lock /></span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input input-dark"
                    />
                  </div>
                </div>

                <hr className="divider-dark" style={{ margin: "0.25rem 0" }} />

                {/* Evaluator quick-fill */}
                <div>
                  <p className="login-demo-label">Academic Evaluator Quick-Logins (Password: Demo@123)</p>
                  <div className="login-demo-grid">
                    <button type="button" className="login-demo-btn" onClick={() => setDemoCreds("admin@medicloud.demo")}>
                      👑 <strong>Admin</strong>
                    </button>
                    <button type="button" className="login-demo-btn" onClick={() => setDemoCreds("doctor@medicloud.demo")}>
                      🩺 <strong>Doctor</strong>
                    </button>
                    <button type="button" className="login-demo-btn" onClick={() => setDemoCreds("reception@medicloud.demo")}>
                      📋 <strong>Reception</strong>
                    </button>
                    <button type="button" className="login-demo-btn" onClick={() => setDemoCreds("patient@medicloud.demo")}>
                      👤 <strong>Patient</strong>
                    </button>
                  </div>
                </div>
              </div>

              <div className="login-card-footer">
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-spinner" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Portal
                      <ArrowRight />
                    </>
                  )}
                </button>
                <p className="login-footer-text">
                  New Patient?{" "}
                  <Link href="/register">Self-Register Profile</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <footer className="login-page-footer">
        MediCloud Clinical Prototype &bull; Synthetic Data Only &bull; HIPAA &amp; Cloud Architecture Capstone
      </footer>
    </div>
  );
}
