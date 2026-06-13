interface Props {
  error: string | null;
  progress: number | null;
  transcodeState: string | null;
}

export function UploadStatus({ error, progress, transcodeState }: Props) {
  return (
    <>
      {error && (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
          {error}
        </p>
      )}
      {progress !== null && progress < 100 && (
        <p className="text-xs text-zinc-500">Subiendo… {progress}%</p>
      )}
      {transcodeState && (
        <p className="text-xs text-zinc-500">Transcodificando: {transcodeState}</p>
      )}
    </>
  );
}
