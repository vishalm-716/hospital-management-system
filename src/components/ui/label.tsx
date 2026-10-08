import React from "react";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <label ref={ref} className={`label ${className}`} {...props}>
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";
