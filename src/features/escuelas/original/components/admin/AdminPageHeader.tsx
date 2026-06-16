import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  eyebrow = 'Administración',
  meta,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#e8f0e8] pb-6 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#006b2d]">{eyebrow}</p>
        <h1 className="mt-1 truncate text-2xl font-black text-[#151d18]">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#5f6d61]">{description}</p>
        {meta && <div className="mt-3 flex flex-wrap gap-2">{meta}</div>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{actions}</div>
      )}
    </div>
  );
}
