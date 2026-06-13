export type Mode = 'photo' | 'video_file' | 'video_url';

interface Props {
  mode: Mode;
  onSelect: (mode: Mode) => void;
}

export function ModeTabs({ mode, onSelect }: Props) {
  return (
    <div className="mb-3 inline-flex w-full overflow-hidden rounded-md border border-zinc-200 text-xs font-medium dark:border-zinc-700">
      {(
        [
          ['photo', 'Foto'],
          ['video_file', 'Video archivo'],
          ['video_url', 'Video URL'],
        ] as Array<[Mode, string]>
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={
            'flex-1 px-3 py-1.5 transition ' +
            (mode === key
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800')
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
