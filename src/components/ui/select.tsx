import React from "react";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <select ref={ref} className={`input ${className}`} style={{
        appearance: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.5rem center",
        backgroundSize: "1.5em 1.5em",
        paddingRight: "2.5rem"
      }} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

// Compat shims for pages that import the Radix-based Select API
export function SelectTrigger({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`input ${className}`} style={{ display: "flex", alignItems: "center", cursor: "pointer" }} {...props}>{children}</div>;
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span style={{ color: "var(--slate-400)" }}>{placeholder}</span>;
}
export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}
