import Image from 'next/image';
import {
  CalendarLineIcon,
  IdCardIcon,
  ShieldLineIcon,
} from './CertificateIcons';

interface CertificateBodyProps {
  uniqueIdCode: string;
  verifiedAt: string;
  tierLabel: string;
  tierBlurb: string;
}

export default function CertificateBody({
  uniqueIdCode,
  verifiedAt,
  tierLabel,
  tierBlurb,
}: CertificateBodyProps) {
  return (
    <>
      {/* Three metadata tiles */}
      <div className="mt-8 grid grid-cols-3 gap-5">
        <Tile
          icon={<IdCardIcon />}
          label="ID de verificación"
          value={
            <span className="font-mono text-base font-bold text-[#0f3d2a]">
              {uniqueIdCode}
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
    </>
  );
}

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
