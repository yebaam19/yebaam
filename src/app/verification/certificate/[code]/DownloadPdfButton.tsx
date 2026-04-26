'use client';

import { useState } from 'react';

interface Props {
  code: string;
}

export default function DownloadPdfButton({ code }: Props) {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/verification/certificate/${encodeURIComponent(code)}/pdf`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yebaam-certificate-${code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-[#c8a86a] px-5 py-2.5 text-sm font-semibold text-[#0f3d2a] shadow-lg transition hover:bg-[#b8975a] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      )}
      {pending ? 'Generando…' : 'Descargar PDF'}
    </button>
  );
}
