import { useEffect, useState } from 'react';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import Badge, { type BadgeVariant } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import type { Campaign } from '../../types';

const TYPE_CONFIG: Record<string, { label: string; variant: BadgeVariant; icon: string }> = {
  SCHOLARSHIP:          { label: 'Beca',                variant: 'purple',  icon: '🎓' },
  DISCOUNT:             { label: 'Descuento',           variant: 'warning', icon: '🏷️' },
  OPEN_ENROLLMENT:      { label: 'Inscripción abierta', variant: 'success', icon: '📋' },
  OPEN_CLASS:           { label: 'Clase abierta',       variant: 'info',    icon: '🎵' },
  ENROLLMENT_PROMOTION: { label: 'Promoción',           variant: 'teal',    icon: '✨' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isCurrent(endsAt: string) {
  return new Date(endsAt) >= new Date();
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    api.get<{ ok: boolean; data: Campaign[] }>('/campaigns')
      .then((r) => setCampaigns(r.data.data))
      .catch((e: { message?: string }) => setError(e.message ?? 'No se pudo cargar campañas'))
      .finally(() => setLoading(false));
  }, []);

  const active   = campaigns.filter((c) => isCurrent(c.endsAt));
  const archived = campaigns.filter((c) => !isCurrent(c.endsAt));

  return (
    <div className="min-h-screen bg-[#f3fcf3]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006b2d]">Oportunidades</p>
          <h1 className="mt-1 text-3xl font-black text-[#151d18]">Campañas y becas</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6d61]">
            Descubre descuentos, becas, clases abiertas y promociones de inscripción.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <EmptyState title="No se pudieron cargar las campañas" description={error} />
        ) : campaigns.length ? (
          <div className="space-y-10">
            {active.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#006b2d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#006b2d]" aria-hidden="true" />
                  Activas ahora ({active.length})
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((c) => <CampaignCard key={c.id} campaign={c} />)}
                </div>
              </div>
            )}
            {archived.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#7a887b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7a887b]" aria-hidden="true" />
                  Finalizadas ({archived.length})
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                  {archived.map((c) => <CampaignCard key={c.id} campaign={c} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="Sin campañas activas"
            description="Vuelve pronto, las escuelas publican nuevas oportunidades regularmente."
            icon={
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            }
          />
        )}
      </section>
    </div>
  );
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const config = TYPE_CONFIG[c.campaignType] ?? { label: c.campaignType, variant: 'default' as BadgeVariant, icon: '📌' };
  const still  = isCurrent(c.endsAt);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#dfeadf] bg-white shadow-sm transition hover:shadow-[0_8px_28px_rgba(29,65,35,0.10)]">
      {/* Image or gradient header */}
      {c.imageUrl ? (
        <div className="relative h-40 overflow-hidden bg-[#eaf3ea]">
          <img
            src={c.imageUrl}
            alt={c.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#e8f5ec] to-[#d4edda]">
          <span className="text-4xl" aria-hidden="true">{config.icon}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={config.variant}>{config.label}</Badge>
          {!still && <Badge variant="default" className="text-[10px]">Finalizada</Badge>}
        </div>

        <h3 className="mt-3 text-base font-black text-[#151d18] line-clamp-2">{c.title}</h3>
        {c.subtitle && <p className="mt-1 text-sm font-semibold text-[#006b2d]">{c.subtitle}</p>}
        <p className="mt-2 flex-1 text-sm leading-6 text-[#5f6d61] line-clamp-3">{c.description}</p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f0f6f0] pt-4">
          <p className="text-xs text-[#7a887b]">
            Hasta {formatDate(c.endsAt)}
          </p>
          {c.ctaUrl && c.ctaLabel && still && (
            <a
              href={c.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-[#006b2d] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#005723]"
            >
              {c.ctaLabel}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
