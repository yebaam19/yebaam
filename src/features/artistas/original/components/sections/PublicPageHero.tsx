import type { ReactNode } from "react";

type PublicPageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  tone?: "green" | "warm";
};

const toneClasses = {
  green: "from-brand-dark via-brand-greenDark to-brand-green",
  warm: "from-brand-dark via-brand-greenDark to-brand-orange"
};

export function PublicPageHero({ eyebrow, title, description, children, tone = "green" }: PublicPageHeroProps) {
  return (
    <section className={`relative isolate overflow-hidden bg-gradient-to-br ${toneClasses[tone]} text-white`} aria-labelledby="page-hero-title">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-45" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-3xl border border-white/15" />
        <div className="absolute bottom-0 left-0 h-28 w-full bg-[linear-gradient(180deg,transparent,rgba(15,31,23,0.42))]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-brand-mintLight">{eyebrow}</p>
          ) : null}
          <h1 id="page-hero-title" className="text-balance text-3xl font-black leading-tight md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/82 md:text-lg">
              {description}
            </p>
          ) : null}
        </div>

        {children ? <div className="mt-7 rounded-2xl border border-white/16 bg-white p-3 text-brand-ink shadow-soft">{children}</div> : null}
      </div>
    </section>
  );
}
