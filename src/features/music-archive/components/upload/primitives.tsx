/** Pure presentational shells — no Spanish text, callers pass translated strings.
 *  Kept as server-component-compatible (no hooks) so they work in either tree. */
export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
