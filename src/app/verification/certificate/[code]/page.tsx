import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Playfair_Display, Great_Vibes } from 'next/font/google';
import QRCode from 'qrcode';
import { getServerClient } from '@/utils/supabase/server';
import YebaamLogo from '@/images/brand/Yebaam-Logo.svg';
import PrintButton from './PrintButton';
import DownloadPdfButton from './DownloadPdfButton';

export const metadata = { title: 'Identidad Digital Certificada · Yebaam' };

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', weight: ['600', '700', '900'] });
const greatVibes = Great_Vibes({ subsets: ['latin'], display: 'swap', weight: '400' });

// Fixed canvas — A4 landscape proportions (1100 × 778 ≈ 297×210mm)
const CERT_W = 1100;
const CERT_H = 800;

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default async function CertificatePage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const { print } = await searchParams;
  const isPrintMode = print === '1';
  const sb = await getServerClient();
  const { data } = await sb
    .from('profiles')
    .select(
      'id, username, first_name, last_name, verified_at, pioneer_number, unique_id_code, is_verified',
    )
    .eq('unique_id_code', code)
    .maybeSingle();

  if (!data || !data.is_verified) notFound();

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username || '—';
  const verifiedAt = data.verified_at
    ? new Date(data.verified_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://yebaam.com';
  const certificateUrl = `${baseUrl}/verification/certificate/${data.unique_id_code}`;
  const displayUrl = `yebaam.com/verify/${data.unique_id_code}`;

  const qrSvg = await QRCode.toString(certificateUrl, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f3d2a', light: '#ffffff00' },
  });

  const isPioneer = data.pioneer_number != null;
  const tierLabel = isPioneer ? 'Miembro Génesis' : 'Miembro Verificado';
  const tierBlurb = isPioneer
    ? 'Reconocido como parte de la comunidad fundadora verificada de Yebaam.'
    : 'Identidad confirmada por Yebaam.';

  // In print mode (?print=1) we render the cert at its native 1100x800 with no
  // page chrome — used by the Puppeteer PDF route and by the @media print stylesheet.
  const stageClassName = isPrintMode ? 'cert-stage relative' : 'cert-stage relative w-full';
  const stageStyle: React.CSSProperties = isPrintMode
    ? { width: `${CERT_W}px`, height: `${CERT_H}px` }
    : { containerType: 'inline-size', aspectRatio: `${CERT_W} / ${CERT_H}` };
  const frameTransform = isPrintMode ? 'none' : `scale(min(1, 100cqi / ${CERT_W}px))`;
  const wrapClassName = isPrintMode
    ? 'cert-stage-wrap'
    : 'cert-stage-wrap mx-auto w-full max-w-[1100px] px-3 sm:px-4 print:max-w-none print:px-0';
  const outerClassName = isPrintMode
    ? 'bg-white'
    : 'min-h-screen bg-[#0c1f17] py-6 sm:py-10 print:bg-white print:py-0';

  return (
    <div className={outerClassName}>
      {/* Print rules: A4 landscape, no chrome, cert at native size */}
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .cert-stage { width: ${CERT_W}px !important; height: ${CERT_H}px !important; aspect-ratio: auto !important; }
          .cert-frame { transform: none !important; box-shadow: none !important; border-radius: 0 !important; }
          .cert-stage-wrap { padding: 0 !important; max-width: none !important; }
        }
      `}</style>

      <div className={wrapClassName}>
        {/*
          Stage: container-query box that scales the fixed cert frame to fit width.
          In print mode it's rendered at native size with no scaling.
        */}
        <div className={stageClassName} style={stageStyle}>
          <div
            className={`${playfair.className} cert-frame absolute left-0 top-0 origin-top-left overflow-hidden bg-[#fbf7ec] ${isPrintMode ? '' : 'shadow-[0_25px_60px_-20px_rgba(0,0,0,0.5)]'}`}
            style={{
              width: `${CERT_W}px`,
              height: `${CERT_H}px`,
              transform: frameTransform,
              colorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            } as React.CSSProperties}
          >
            <Guilloche />

            {/* Outer ornate border */}
            <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-[#0f3d2a]" />
            <div className="pointer-events-none absolute inset-5 rounded-lg border border-[#c8a86a]/70" />

            {/* Y watermark */}
            <Image
              src="/watermark.png"
              alt=""
              width={520}
              height={520}
              aria-hidden
              priority
              className="pointer-events-none absolute -right-16 -top-12 h-[460px] w-[460px] object-contain opacity-90"
            />

            {/* Top-left ribbon */}
            <Image
              src="/topleft.png"
              alt=""
              width={180}
              height={260}
              aria-hidden
              priority
              className="pointer-events-none absolute -left-2 -top-2 z-10 h-56 w-auto"
            />

            <div className="relative px-20 pb-14 pt-14">
              {/* Header */}
              <header className="text-center">
                <div className="flex items-center justify-center">
                  <Image src={YebaamLogo} alt="Yebaam" priority className="h-14 w-auto" />
                </div>
                <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#0f3d2a]/80">
                  <span className="h-px w-10 bg-[#c8a86a]" />
                  Identidad Digital Certificada
                  <span className="h-px w-10 bg-[#c8a86a]" />
                </div>
                <div className="mt-2 flex items-center justify-center">
                  <Diamond />
                </div>
              </header>

              {/* Name */}
              <div className="mt-6 text-center">
                <h1 className="break-words text-[56px] font-bold leading-tight text-[#0f3d2a]">
                  {fullName}
                </h1>
                {data.username && (
                  <p className="mt-1 text-lg text-neutral-500">@{data.username}</p>
                )}
              </div>

              {/* Three metadata tiles */}
              <div className="mt-8 grid grid-cols-3 gap-5">
                <Tile
                  icon={<IdCardIcon />}
                  label="ID de verificación"
                  value={
                    <span className="font-mono text-base font-bold text-[#0f3d2a]">
                      {data.unique_id_code}
                    </span>
                  }
                />
                <Tile
                  icon={<CalendarLineIcon />}
                  label="Verificado el"
                  value={
                    <span className="text-base font-bold text-[#0f3d2a]">{verifiedAt}</span>
                  }
                />
                <Tile
                  icon={<ShieldLineIcon />}
                  label="Estado"
                  value={
                    <span className="flex items-center gap-2 text-base font-bold text-[#0f3d2a]">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      Identidad Verificada
                    </span>
                  }
                />
              </div>

              {/* Member Tier */}
              <div className="mt-6 rounded-2xl border border-[#c8a86a]/40 bg-white/60 px-8 py-4 shadow-sm">
                <div className="flex flex-row items-center gap-8 text-left">
                  <Image
                    src="/crown.png"
                    alt=""
                    width={140}
                    height={140}
                    aria-hidden
                    className="h-16 w-16 shrink-0 object-contain"
                  />
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                      Nivel de miembro
                    </div>
                    <div className="mt-1 text-2xl font-bold text-[#0f3d2a]">{tierLabel}</div>
                  </div>
                  <p className="max-w-xs text-sm leading-relaxed text-neutral-700">{tierBlurb}</p>
                </div>
              </div>

              {/* QR + Signature */}
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
                      className={`${greatVibes.className} mt-1 whitespace-nowrap text-[44px] leading-tight text-[#0f3d2a]`}
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

              {/* Footer strip */}
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
            </div>
          </div>
        </div>

        {/* Download / Print CTAs — outside the framed certificate so they don't print/export */}
        {!isPrintMode && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <DownloadPdfButton code={data.unique_id_code} />
            <PrintButton />
          </div>
        )}
      </div>
    </div>
  );
}

/* -------- Subcomponents -------- */

function Tile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#c8a86a]/40 bg-white/80 px-5 py-4 shadow-[0_1px_2px_rgba(15,61,42,0.04)]">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c8a86a]/60 text-[#0f3d2a]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9d7a3a]">
            {label}
          </div>
          <div className="mt-1 truncate">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 14 14" className="h-3 w-3 text-[#c8a86a]" aria-hidden>
      <rect x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" fill="currentColor" />
    </svg>
  );
}

function Guilloche() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1400 1000">
        <defs>
          <pattern id="weave" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 0 7 L 14 7 M 7 0 L 7 14" stroke="#0f3d2a" strokeWidth="0.3" opacity="0.05" />
          </pattern>
          <pattern id="diagonal" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#0f3d2a" strokeWidth="0.3" opacity="0.04" />
          </pattern>
        </defs>
        <rect width="1400" height="1000" fill="url(#weave)" />
        <rect width="1400" height="1000" fill="url(#diagonal)" />
        <g stroke="#0f3d2a" strokeWidth="0.4" fill="none" opacity="0.08">
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={`l${i}`} cx="-60" cy="500" r={140 + i * 18} />
          ))}
        </g>
        <g stroke="#0f3d2a" strokeWidth="0.4" fill="none" opacity="0.08">
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={`r${i}`} cx="1460" cy="500" r={140 + i * 18} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function IdCardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <line x1="14" y1="10" x2="18" y2="10" />
      <line x1="14" y1="13" x2="18" y2="13" />
      <line x1="6" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function CalendarLineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <line x1="8" y1="3" x2="8" y2="6" />
      <line x1="16" y1="3" x2="16" y2="6" />
    </svg>
  );
}

function ShieldLineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
      <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LockMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden>
      <path
        fillRule="evenodd"
        d="M12 1.5A4.5 4.5 0 0 0 7.5 6v3h-1A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9h-1V6A4.5 4.5 0 0 0 12 1.5Zm-3 7.5V6a3 3 0 1 1 6 0v3H9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
