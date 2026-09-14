import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-brand-100",
  secondary:
    "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-500",
};

export const Button = ({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps): JSX.Element => (
  <button
    type={type}
    className={cn(
      "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
      variantClasses[variant],
      className,
    )}
    {...props}
  />
);
