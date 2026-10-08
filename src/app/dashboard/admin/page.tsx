import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminKPIs } from "@/app/actions/admin";
import prisma from "@/lib/prisma";
import { Shell } from "@/components/layout/Shell";
import { formatCurrency } from "@/lib/utils";
import { AdminCharts } from "./AdminCharts";

function StatCard({
  label, value, sub, color
}: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${color}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {color === "teal" && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
          {color === "blue" && <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
          {color === "emerald" && <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>}
          {color === "violet" && <><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></>}
        </svg>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "0.2rem" }}>{sub}</div>
      </div>
    </div>
  );
}

const roleBadgeColor: Record<string, string> = {
  ADMIN: "#7c3aed", DOCTOR: "#0d9488", RECEPTIONIST: "#0284c7", PATIENT: "#64748b",
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  let kpis: any = {
    patientsToday: 0, appointmentsToday: 0, revenueThisMonth: 0,
    bedOccupancyRate: 0, occupiedBeds: 0, totalBeds: 0,
    appointmentTrends: [], revenueTrend: [], departmentData: [],
  };

  try { kpis = await getAdminKPIs(); } catch {}

  let staff: any[] = [];
  let recentLogs: any[] = [];

  try {
    staff = await prisma.user.findMany({
      where: { role: { not: "PATIENT" } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { doctorProfile: { include: { department: true } } },
    });
    recentLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  } catch {}

  return (
    <Shell userRole="ADMIN" userName={session.user.name}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Page Header */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--slate-900)", letterSpacing: "-0.025em" }}>
              Hospital Executive Overview
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--slate-500)", marginTop: "0.25rem" }}>
              Welcome back, {session.user.name}. Here is today&apos;s operational pulse.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/audit-logs" style={{ textDecoration: "none" }}>
              <button className="btn btn-secondary btn-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Audit Logs
              </button>
            </Link>
            <Link href="/settings" style={{ textDecoration: "none" }}>
              <button className="btn btn-primary btn-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Add Staff Member
              </button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <StatCard label="Patients Today" value={kpis.patientsToday} sub="Outpatient registrations" color="teal" />
          <StatCard label="Appointments Today" value={kpis.appointmentsToday} sub="Consultations scheduled" color="blue" />
          <StatCard label="Revenue This Month" value={formatCurrency(kpis.revenueThisMonth)} sub="Paid invoices" color="emerald" />
          <StatCard label="Bed Occupancy" value={`${kpis.bedOccupancyRate}%`} sub={`${kpis.occupiedBeds} of ${kpis.totalBeds} beds active`} color="violet" />
        </div>

        {/* Charts */}
        <AdminCharts
          appointmentTrends={kpis.appointmentTrends}
          revenueTrend={kpis.revenueTrend}
          departmentData={kpis.departmentData}
        />

        {/* Staff & Audit */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          
          {/* Staff Directory */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="card-title">Active Staff Directory</div>
                <div className="card-description">Clinical and administrative personnel</div>
              </div>
              <Link href="/settings" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--teal-600)" }}>Manage Staff</button>
              </Link>
            </div>
            <div className="card-content" style={{ padding: 0 }}>
              {staff.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--slate-500)", fontSize: "0.875rem" }}>
                  No staff records found
                </div>
              ) : staff.map((s, i) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < staff.length - 1 ? "1px solid var(--slate-100)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      height: "2.25rem", width: "2.25rem", borderRadius: "9999px",
                      background: `${roleBadgeColor[s.role]}20`,
                      color: roleBadgeColor[s.role],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.8125rem", flexShrink: 0,
                    }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--slate-900)" }}>{s.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>{s.email}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className={`badge badge-${s.role === "DOCTOR" ? "teal" : s.role === "ADMIN" ? "violet" : "blue"}`}>
                      {s.role}
                    </span>
                    <span style={{
                      height: "0.5rem", width: "0.5rem", borderRadius: "9999px",
                      background: s.isActive ? "var(--emerald-500)" : "var(--rose-500)",
                      display: "inline-block",
                      boxShadow: s.isActive ? "0 0 4px rgba(16,185,129,0.5)" : "0 0 4px rgba(244,63,94,0.5)",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="card-title">Security &amp; Audit Activity</div>
                <div className="card-description">Recent patient data access and actions</div>
              </div>
              <Link href="/audit-logs" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--teal-600)" }}>View All</button>
              </Link>
            </div>
            <div className="card-content" style={{ padding: 0 }}>
              {recentLogs.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--slate-500)", fontSize: "0.875rem" }}>
                  No audit logs found
                </div>
              ) : recentLogs.map((log, i) => (
                <div key={log.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < recentLogs.length - 1 ? "1px solid var(--slate-100)" : "none",
                }}>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--slate-800)" }}>{log.action}</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--slate-500)", marginTop: "0.1rem" }}>
                      {log.entity} &bull; by {log.user?.name || "System"}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.6875rem", color: "var(--slate-400)", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
