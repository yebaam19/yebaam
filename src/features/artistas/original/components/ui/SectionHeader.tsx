import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  accent?: string;
  /** Invierte los colores del texto para usar sobre fondos oscuros */
  dark?: boolean;
};

export function SectionHeader({ title, description, action, accent, dark = false }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {accent ? (
          <span className={`mb-2 block text-xs font-bold uppercase tracking-widest ${dark ? "text-brand-greenSoft" : "text-brand-dark"}`}>
            {accent}
          </span>
        ) : null}
        <h2 className={`text-xl font-black md:text-2xl ${dark ? "text-white" : "text-brand-ink"}`}>{title}</h2>
        {description ? (
          <p className={`mt-1 text-sm ${dark ? "text-white/70" : "text-brand-muted"}`}>{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
