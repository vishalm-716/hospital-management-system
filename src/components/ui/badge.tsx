import React from "react";

export type BadgeVariant =
  | "teal"
  | "emerald"
  | "amber"
  | "rose"
  | "slate"
  | "blue"
  | "violet"
  | "dark"
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | string;
}

export function Badge({ variant = "slate", className = "", children, ...props }: BadgeProps) {
  const variantMap: Record<string, string> = {
    default: "blue",
    secondary: "slate",
    destructive: "rose",
    outline: "slate",
  };

  const resolvedVariant = variantMap[variant] || variant;

  return (
    <span className={`badge badge-${resolvedVariant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
