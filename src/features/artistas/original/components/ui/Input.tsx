import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-10 w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/60 focus:border-brand-greenDark focus:ring-2 focus:ring-brand-greenDark/15 disabled:cursor-not-allowed disabled:bg-brand-bgGreen disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
