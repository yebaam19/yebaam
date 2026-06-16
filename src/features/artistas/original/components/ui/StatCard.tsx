import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
};

export function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-black text-brand-ink">{value}</p>
          {trend ? (
            <p className={`mt-1 text-xs font-semibold ${trendUp ? "text-brand-dark" : "text-brand-muted"}`}>{trend}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mintLight text-brand-greenDark">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
