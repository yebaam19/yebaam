import { ChangeEvent, useRef, useState } from 'react';
import api from '../../lib/api';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
  label?: string;
  schoolId?: string;
  type?: string;
}

export default function ImageUploader({
  onUpload, currentUrl, label = 'Imagen', schoolId, type = 'GALLERY',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      if (schoolId) fd.append('schoolId', schoolId);

      const res = await api.post<{ ok: boolean; data: { url: string } }>('/media/upload', fd);
      onUpload(res.data.data.url);
    } catch (err: unknown) {
      setUploadError((err as { message?: string })?.message ?? 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <p className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative mt-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#006b2d] hover:bg-[#f6fef7] disabled:opacity-60"
      >
        {currentUrl ? (
          <img src={currentUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className={`relative flex flex-col items-center gap-1 ${currentUrl ? 'rounded-xl bg-black/40 px-3 py-2' : ''}`}>
          {uploading ? (
            <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className={`h-6 w-6 ${currentUrl ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span className={`text-xs font-medium ${currentUrl ? 'text-white' : 'text-slate-500'}`}>
            {uploading ? 'Subiendo...' : currentUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </span>
        </div>
      </button>
      {uploadError && (
        <p className="mt-1 text-xs text-red-500">{uploadError}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
