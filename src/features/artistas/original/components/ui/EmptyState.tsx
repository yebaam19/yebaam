import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-brand-bgGreen/40 px-6 py-14 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-mintLight text-brand-greenDark" aria-hidden="true">
        {icon ?? <SearchX size={28} />}
      </div>
      <h3 className="text-lg font-bold text-brand-ink">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
