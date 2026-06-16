import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function SectionHeader({ eyebrow = 'Explorar', title, subtitle, children }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#006b2d]">{eyebrow}</p>
          )}
          <h2 className="text-3xl font-black text-[#151d18]">{title}</h2>
          {subtitle && <p className="mt-2 text-sm leading-6 text-[#5f6d61]">{subtitle}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
