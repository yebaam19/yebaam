import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Playfair_Display, Great_Vibes } from 'next/font/google';
import QRCode from 'qrcode';
import { getServerClient } from '@/utils/supabase/server';
import { Guilloche } from './_components/CertificateIcons';
import CertificateHeader from './_components/CertificateHeader';
import CertificateBody from './_components/CertificateBody';
import CertificateQr from './_components/CertificateQr';
import CertificateFooter from './_components/CertificateFooter';
import CertificateActions from './_components/CertificateActions';

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
              <CertificateHeader fullName={fullName} username={data.username} />

              <CertificateBody
                uniqueIdCode={data.unique_id_code}
                verifiedAt={verifiedAt}
                tierLabel={tierLabel}
                tierBlurb={tierBlurb}
              />

              <CertificateQr
                qrSvg={qrSvg}
                displayUrl={displayUrl}
                signatureClassName={greatVibes.className}
              />

              <CertificateFooter />
            </div>
          </div>
        </div>

        {!isPrintMode && <CertificateActions code={data.unique_id_code} />}
      </div>
    </div>
  );
}
