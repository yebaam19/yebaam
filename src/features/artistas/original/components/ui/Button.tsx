import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "ghost-light" | "danger" | "dark" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:      "bg-brand-greenDark text-white shadow-green hover:bg-brand-greenDeep",
  secondary:    "bg-brand-mintLight text-brand-dark border border-brand-green/30 hover:bg-[#d4f1de]",
  accent:       "bg-brand-orange text-brand-ink shadow-orange hover:bg-brand-gold",
  ghost:        "bg-transparent text-brand-ink hover:bg-brand-mintLight",
  "ghost-light":"bg-white/10 text-white border border-white/25 hover:bg-white/20",
  danger:       "bg-red-500 text-white hover:bg-red-600",
  dark:         "bg-brand-dark text-white hover:bg-brand-surfaceDark",
  outline:      "border border-brand-green text-brand-dark bg-transparent hover:bg-brand-mintLight"
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 py-1.5 text-xs gap-1.5",
  md: "min-h-10 px-5 py-2.5 text-sm gap-2",
  lg: "min-h-12 px-7 py-3 text-base gap-2.5"
};

export function Button({ className = "", variant = "primary", size = "md", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
