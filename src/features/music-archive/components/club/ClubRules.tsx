interface Props {
  rules: string[];
}

/** Numbered rule list. Falls back to a friendly empty state. */
export function ClubRules({ rules }: Props) {
  if (!rules.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        Este club aún no ha publicado reglas.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {rules.map((r, i) => (
        <li
          key={i}
          className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {i + 1}
          </span>
          <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{r}</p>
        </li>
      ))}
    </ol>
  );
}
