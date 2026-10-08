"use client";

import React from "react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={() => onOpenChange?.(false)}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function DialogContent({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`modal ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`modal-header ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h2 className={`modal-title ${className}`.trim()} style={style}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p
      className={`modal-description ${className}`.trim()}
      style={{
        fontSize: "0.8125rem",
        color: "var(--slate-500)",
        marginTop: "0.25rem",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function DialogFooter({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`modal-footer ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function DialogTrigger({
  children,
  asChild,
  className = "",
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  return <>{children}</>;
}
