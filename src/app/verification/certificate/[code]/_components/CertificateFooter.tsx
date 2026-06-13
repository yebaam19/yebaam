import { LockMiniIcon } from './CertificateIcons';

// Security footer strip — sits below the QR / signature row.
export default function CertificateFooter() {
  return (
    <div className="mt-6 rounded-lg border border-[#c8a86a]/40 bg-white/40 px-5 py-3 text-xs">
      <div className="flex flex-row items-center gap-4">
        <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-[#0f3d2a]">
          <LockMiniIcon /> Inviolable y Seguro
        </span>
        <span className="h-3 w-px bg-neutral-300" />
        <span className="text-neutral-600">
          Este certificado está protegido criptográficamente y no puede ser alterado.
        </span>
      </div>
    </div>
  );
}
