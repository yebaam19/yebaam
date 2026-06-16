import { Link } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useAdminStats } from '../../hooks/useAdminStats';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

type StatsKey =
  | 'totalSchools' | 'totalPrograms' | 'totalLeads' | 'newLeads'
  | 'totalTrialRequests' | 'pendingTrialRequests' | 'totalReviews'
  | 'upcomingEvents' | 'activeCampaigns' | 'publishedArticles' | 'totalMediaAssets';

interface MetricCard {
  label: string;
  key: StatsKey;
  sublabel?: string;
  subkey?: StatsKey;
  iconPath: string;
  color: string;
  bg: string;
  border: string;
}

const METRICS: MetricCard[] = [
  {
    label: 'Escuelas activas', key: 'totalSchools',
    iconPath: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
    color: 'text-[#006b2d]', bg: 'bg-[#e8f5ec]', border: 'border-[#c3e6cc]',
  },
  {
    label: 'Programas activos', key: 'totalPrograms',
    iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100',
  },
  {
    label: 'Solicitudes', key: 'totalLeads', sublabel: 'nuevas', subkey: 'newLeads',
    iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100',
  },
  {
    label: 'Clases de prueba', key: 'totalTrialRequests', sublabel: 'pendientes', subkey: 'pendingTrialRequests',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100',
  },
  {
    label: 'Reseñas', key: 'totalReviews',
    iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100',
  },
  {
    label: 'Eventos próximos', key: 'upcomingEvents',
    iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-100',
  },
  {
    label: 'Campañas activas', key: 'activeCampaigns',
    iconPath: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100',
  },
  {
    label: 'Artículos publicados', key: 'publishedArticles',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100',
  },
  {
    label: 'Fotos y reels', key: 'totalMediaAssets',
    iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-100',
  },
];

interface QuickAction { label: string; to: string; iconPath: string }

const SCHOOL_ACTIONS: QuickAction[] = [
  { label: 'Editar perfil',       to: '/admin/school',        iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { label: 'Nuevo programa',      to: '/admin/programs',      iconPath: 'M12 4v16m8-8H4' },
  { label: 'Subir foto/reel',     to: '/admin/media',         iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Ver solicitudes',     to: '/admin/leads',         iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Clases de prueba',    to: '/admin/trial-classes', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Crear artículo',      to: '/admin/articles',      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Gestionar sedes',     to: '/admin/campuses',      iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { label: 'Horarios',            to: '/admin/schedules',     iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const PLATFORM_ACTIONS: QuickAction[] = [
  { label: 'Gestión de escuelas', to: '/admin/schools',    iconPath: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
  { label: 'Ver actividad',       to: '/admin/activity',   iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Campañas',            to: '/admin/campaigns',  iconPath: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { label: 'Eventos',             to: '/admin/events',     iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

export default function DashboardPage() {
  const { stats, loading, error } = useAdminStats();
  const { user } = useAuth();
  const isPlatform = user?.role === 'PLATFORM_ADMIN';
  const quickActions = isPlatform ? PLATFORM_ACTIONS : SCHOOL_ACTIONS;

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const hasActivity = stats && METRICS.some((m) => (stats[m.key] ?? 0) > 0);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description={
          isPlatform
            ? 'Vista global de escuelas, programas, solicitudes y actividad de la plataforma.'
            : 'Métricas de tu escuela, solicitudes recientes y accesos rápidos para operar.'
        }
      />

      {/* Metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {METRICS.map((m) => (
          <div
            key={m.key}
            className={`rounded-2xl border ${m.border} ${m.bg} p-5`}
          >
            {loading ? (
              <div className="space-y-3">
                <Skeleton height="12px" width="55%" />
                <Skeleton height="34px" width="35%" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-[#5f6d61]">{m.label}</p>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 ${m.color}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d={m.iconPath} />
                    </svg>
                  </div>
                </div>
                <p className={`mt-2 text-3xl font-black ${m.color}`}>{stats?.[m.key] ?? 0}</p>
                {m.subkey && (
                  <p className="mt-1 text-xs text-[#5f6d61]">
                    <span className={`font-bold ${m.color}`}>{stats?.[m.subkey] ?? 0}</span>{' '}
                    {m.sublabel}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Empty activity notice */}
      {!loading && !hasActivity && (
        <div className="rounded-2xl border border-dashed border-[#dce8dc] bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f5ec]">
            <svg className="h-6 w-6 text-[#006b2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="font-bold text-[#151d18]">Todavía no hay actividad registrada</p>
          <p className="mt-1 text-sm text-[#5f6d61]">Cuando publiques programas, eventos o solicitudes, las métricas aparecerán aquí.</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-2xl border border-[#dfeadf] bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#7a887b]">Accesos rápidos</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ label, to, iconPath }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl border border-[#dfeadf] px-4 py-3 text-sm font-semibold text-[#253429] transition hover:border-[#006b2d] hover:bg-[#f3fcf3] hover:text-[#006b2d]"
            >
              <svg className="h-4 w-4 shrink-0 text-[#006b2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
