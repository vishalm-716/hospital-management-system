import React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { DemoBanner } from "./DemoBanner";

interface ShellProps {
  children: React.ReactNode;
  userRole: string;
  userName?: string;
  breadcrumb?: string;
}

export function Shell({ children, userRole, userName, breadcrumb }: ShellProps) {
  return (
    <div className="app-shell">
      <DemoBanner />
      <div className="app-body">
        <Sidebar userRole={userRole} userName={userName} />
        <div className="main-content">
          <Navbar userName={userName} userRole={userRole} breadcrumb={breadcrumb} />
          <main>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
