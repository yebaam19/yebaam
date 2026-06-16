import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: "green" | "orange" | "gold" | "default";
};

const colorMap = {
  green:   "bg-brand-mintLight text-brand-green",
  orange:  "bg-orange-50 text-brand-orange",
  gold:    "bg-yellow-50 text-amber-600",
  default: "bg-brand-bgGreen text-brand-muted"
};

export function MetricCard({ label, value, icon, color = "green" }: MetricCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-white p-4 shadow-card">
      {icon ? (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
        <p className="mt-0.5 text-xl font-black text-brand-ink">{value}</p>
      </div>
    </div>
  );
}
