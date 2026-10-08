import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "default" | "destructive";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const variantMap: Record<string, string> = {
      primary: "btn-primary",
      default: "btn-primary",
      secondary: "btn-secondary",
      danger: "btn-danger",
      destructive: "btn-danger",
      ghost: "btn-ghost",
      outline: "btn-outline",
    };

    const sizeMap: Record<string, string> = {
      xs: "btn-xs",
      sm: "btn-sm",
      md: "",
      lg: "btn-lg",
      icon: "btn-icon",
    };

    const variantClass = variantMap[variant] || "btn-primary";
    const sizeClass = sizeMap[size] || "";

    return (
      <button
        ref={ref}
        className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
