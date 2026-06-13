import Image from 'next/image';
import { LockMiniIcon } from './CertificateIcons';

interface CertificateQrProps {
  qrSvg: string;
  displayUrl: string;
  signatureClassName: string;
}

export default function CertificateQr({
  qrSvg,
  displayUrl,
  signatureClassName,
}: CertificateQrProps) {
  return (
    <div className="mt-6 grid grid-cols-2 items-start gap-12">
      <div className="flex flex-row items-center gap-5 text-left">
        <div className="relative rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <div
            aria-label={`Código QR para ${displayUrl}`}
            className="h-32 w-32"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white shadow ring-1 ring-[#0f3d2a]/20"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0f3d2a] text-[10px] font-black text-white">
              Y
            </span>
          </span>
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#0f3d2a]">
            Verificar esta identidad
          </div>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            Escanea el código QR o visita el enlace para verificar la autenticidad de este
            certificado.
          </p>
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-mono text-xs text-neutral-700 shadow-sm">
            <LockMiniIcon />
            <span className="break-all">{displayUrl}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center justify-end gap-8 text-right">
        <div className="flex flex-col items-end">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#0f3d2a]">
            Firma digital
          </div>
          <div
            className={`${signatureClassName} mt-1 whitespace-nowrap text-[44px] leading-tight text-[#0f3d2a]`}
            aria-label="Firma de Autoridad Yebaam"
          >
            Yebaam Authority
          </div>
          <div className="mt-1 h-px w-48 bg-[#c8a86a]" />
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#0f3d2a]">
            Autoridad Yebaam
          </div>
          <div className="text-[11px] tracking-wide text-neutral-500">Verificación Oficial</div>
        </div>
        <Image
          src="/goldprint.png"
          alt=""
          width={220}
          height={220}
          aria-hidden
          className="h-32 w-32 shrink-0 object-contain"
        />
      </div>
    </div>
  );
}
