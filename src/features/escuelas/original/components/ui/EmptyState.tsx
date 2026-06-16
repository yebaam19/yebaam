import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export default function EmptyState({ title, description, icon, children }: Props) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#dce8dc] bg-white/70 px-8 py-14 text-center">
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f5ec] text-[#006b2d]">
          {icon}
        </div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f5ec]">
          <svg className="h-7 w-7 text-[#006b2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-bold text-[#151d18]">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-[#5f6d61]">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
