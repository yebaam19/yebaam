import { useState } from 'react';

interface VideoUploadFieldProps {
  label: string;
  description: string;
  currentUrl?: string | null;
  onChange: (url: string | null) => void;
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function VideoUploadField({ label, description, currentUrl, onChange }: VideoUploadFieldProps) {
  const [draft, setDraft] = useState(currentUrl ?? '');
  const [error, setError] = useState<string | null>(null);

  function applyUrl() {
    if (!isValidUrl(draft)) {
      setError('Usa una URL válida de Instagram, TikTok, YouTube Shorts o un archivo externo.');
      return;
    }
    setError(null);
    onChange(draft.trim() || null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-black text-slate-900">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
        La subida directa de video todavía no está habilitada en el backend. Registra una URL externa y se mostrará como reel o video en el perfil.
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        <div><dt className="font-semibold text-slate-700">Recomendado</dt><dd>Vertical 9:16, 1080 x 1920 px</dd></div>
        <div><dt className="font-semibold text-slate-700">Duración</dt><dd>15 a 60 segundos</dd></div>
        <div><dt className="font-semibold text-slate-700">Formatos si se habilita subida</dt><dd>MP4 o MOV</dd></div>
        <div><dt className="font-semibold text-slate-700">Máximo sugerido</dt><dd>50 MB</dd></div>
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={applyUrl}
          placeholder="https://www.instagram.com/reel/..."
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:border-[#006b2d] focus:outline-none"
        />
        <button
          type="button"
          onClick={applyUrl}
          className="rounded-full bg-[#006b2d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#005723]"
        >
          Usar URL
        </button>
        {currentUrl ? (
          <button
            type="button"
            onClick={() => {
              setDraft('');
              setError(null);
              onChange(null);
            }}
            className="rounded-full border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Quitar
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
