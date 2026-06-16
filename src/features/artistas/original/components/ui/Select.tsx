import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-10 w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-ink outline-none transition focus:border-brand-greenDark focus:ring-2 focus:ring-brand-greenDark/15 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
