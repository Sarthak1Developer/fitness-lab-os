import * as React from "react";

export const Input = React.forwardRef(function Input(
  { className = "", type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";
