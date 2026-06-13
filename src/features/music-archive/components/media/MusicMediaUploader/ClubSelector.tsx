interface ClubRef {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  clubs: ClubRef[];
  selectedClubIds: Set<string>;
  onToggle: (id: string) => void;
}

export function ClubSelector({ clubs, selectedClubIds, onToggle }: Props) {
  if (clubs.length === 0) return null;

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Clubes (solo donde eres miembro)
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {clubs.map((c) => {
          const selected = selectedClubIds.has(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onToggle(c.id)}
                className={
                  'rounded-full border px-2.5 py-1 text-xs ' +
                  (selected
                    ? 'border-rose-400 bg-rose-100 text-rose-900 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300')
                }
              >
                {c.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
