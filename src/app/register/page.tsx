"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, User, Phone, Calendar, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "MALE",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fData = new FormData();
    Object.entries(formData).forEach(([k, v]) => fData.append(k, v));

    const res = await registerAction(undefined, fData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  return (
    <div className="login-page">
      <DemoBanner />

      <div className="login-center" style={{ padding: "2.5rem 1rem" }}>
        <div className="login-box" style={{ maxWidth: "520px" }}>
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
              }}>PORTAL</span>
            </h1>
            <p className="login-subtitle">Self-Service Patient Registration &amp; Medical Records</p>
          </div>

          {/* Form Card */}
          <div className="login-card">
            <div className="login-card-header">
              <h2 className="login-card-title">Create Patient Account</h2>
              <p className="login-card-desc">Enter your details to generate your digital health record</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="login-card-body">
                {error && (
                  <div className="login-error">
                    <ShieldAlert style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "rgba(6, 95, 70, 0.4)",
                    border: "1px solid #059669",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8125rem",
                    color: "#6ee7b7",
                  }}>
                    <CheckCircle2 style={{ width: "1.125rem", height: "1.125rem", color: "#34d399", flexShrink: 0 }} />
                    <span>Registration successful! Redirecting to login...</span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="name" style={{ color: "var(--slate-300)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", display: "block" }}>
                      Full Name
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><User /></span>
                      <input
                        id="name"
                        required
                        placeholder="Rajesh Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input input-dark"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="phone" style={{ color: "var(--slate-300)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", display: "block" }}>
                      Phone Number
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Phone /></span>
                      <input
                        id="phone"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input input-dark"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="email" style={{ color: "var(--slate-300)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", display: "block" }}>
                    Email Address
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon"><Mail /></span>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input input-dark"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="dateOfBirth" style={{ color: "var(--slate-300)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", display: "block" }}>
                      Date of Birth
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Calendar /></span>
                      <input
                        id="dateOfBirth"
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="input input-dark"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="gender" style={{ color: "var(--slate-300)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", display: "block" }}>
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="input input-dark"
                      style={{ height: "42px" }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="login-card-footer" style={{ marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="login-submit-btn"
                >
                  <span>{loading ? "Creating Account..." : "Create Patient Account"}</span>
                  <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                </button>

                <p className="login-footer-text">
                  Already have an account?{" "}
                  <Link href="/login">Sign In to Station</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
