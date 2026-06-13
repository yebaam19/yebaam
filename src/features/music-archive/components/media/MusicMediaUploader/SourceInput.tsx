import type { Mode } from './ModeTabs';

interface Props {
  mode: Mode;
  embedUrl: string;
  onEmbedUrlChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
}

export function SourceInput({ mode, embedUrl, onEmbedUrlChange, onFileChange }: Props) {
  const acceptByMode =
    mode === 'photo' ? 'image/*' : mode === 'video_file' ? 'video/*' : undefined;

  if (mode === 'video_url') {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          URL de YouTube o Vimeo
        </label>
        <input
          value={embedUrl}
          onChange={(e) => onEmbedUrlChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {mode === 'photo' ? 'Archivo de imagen' : 'Archivo de video (MP4)'}
      </label>
      <input
        type="file"
        accept={acceptByMode}
        onChange={(e) => {
          const f = e.target.files?.[0];
          onFileChange(f ?? null);
        }}
        className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-amber-900 hover:file:bg-amber-200 dark:text-zinc-300 dark:file:bg-amber-900/30 dark:file:text-amber-200"
      />
    </div>
  );
}
