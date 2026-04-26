'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-[#0f3d2a] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0a2a1c]"
      title="Para incluir el fondo del certificado, activa la opción 'Background graphics' al imprimir."
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
        <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="7" />
      </svg>
      Imprimir / Guardar PDF
    </button>
  );
}
