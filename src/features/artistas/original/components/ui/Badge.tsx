import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "green" | "orange" | "gold" | "mint" | "dark" | "error" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default:  "border border-brand-border bg-white text-brand-muted",
  green:    "border border-brand-green/40 bg-brand-mintLight text-brand-dark",
  orange:   "border border-brand-orange/30 bg-orange-50 text-brand-orange",
  gold:     "border border-brand-gold/30 bg-yellow-50 text-amber-700",
  mint:     "border border-brand-mint/60 bg-brand-bgGreen text-brand-dark",
  dark:     "border border-brand-dark/20 bg-brand-dark text-white",
  error:    "border border-red-200 bg-red-50 text-red-600",
  warning:  "border border-amber-200 bg-amber-50 text-amber-700"
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
