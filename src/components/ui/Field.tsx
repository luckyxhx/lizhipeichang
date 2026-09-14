import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const Field = ({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps): JSX.Element => (
  <div className={cn("space-y-2", className)}>
    <label className="block text-sm font-semibold text-slate-800" htmlFor={htmlFor}>
      {label}
      {required ? <span className="ml-1 text-brand-600">*</span> : null}
    </label>
    {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    {children}
    {error ? (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    ) : null}
  </div>
);
