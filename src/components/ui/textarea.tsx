import React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`input ${className}`}
        style={{ resize: "vertical", minHeight: "80px" }}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
