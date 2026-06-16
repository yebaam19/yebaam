import { useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardPage       from './DashboardPage';
import SchoolProfileAdmin  from './SchoolProfileAdmin';
import SchoolsAdmin        from './SchoolsAdmin';
import LeadsAdmin          from './LeadsAdmin';
import TrialClassesAdmin   from './TrialClassesAdmin';
import EventsAdmin         from './EventsAdmin';
import CampaignsAdmin      from './CampaignsAdmin';
import ProgramsAdmin       from './ProgramsAdmin';
import InstructorsAdmin    from './InstructorsAdmin';
import ActivityAdmin       from './ActivityAdmin';
import ArticlesAdmin       from './ArticlesAdmin';
import MediaAdmin          from './MediaAdmin';
import CampusesAdmin       from './CampusesAdmin';
import SchedulesAdmin      from './SchedulesAdmin';

// ─── Nav item types ────────────────────────────────────────
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

function Icon({ path }: { path: string }) {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICONS = {
  dashboard:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  school:     'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  schools:    'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  leads:      'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  trial:      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  programs:   'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  instructors:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  campuses:   'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
  schedules:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  media:      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  articles:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  campaigns:  'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  events:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  activity:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

function navItem(to: string, label: string, iconPath: string, end = false): NavItem {
  return { to, label, icon: <Icon path={iconPath} />, end };
}

// ─── NavGroup component ─────────────────────────────────────
function NavGroup({ label, items, mobile = false, onNavigate }: {
  label: string;
  items: NavItem[];
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const activeCls = mobile
    ? 'bg-[#006b2d] text-white'
    : 'bg-[#e8f5ec] text-[#006b2d]';
  const idleCls = mobile
    ? 'text-[#2f3d32] hover:bg-[#f3fcf3]'
    : 'text-[#3d4d3f] hover:bg-[#f3fcf3] hover:text-[#006b2d]';

  return (
    <div>
      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a887b]">{label}</p>
      <div className="space-y-0.5">
        {items.map(({ to, label: lbl, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? activeCls : idleCls}`
            }
          >
            {icon}
            {lbl}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ─── NavContent ─────────────────────────────────────────────
function NavContent({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { user } = useAuth();
  const isSchool    = user?.role === 'SCHOOL_ADMIN';
  const isPlatform  = user?.role === 'PLATFORM_ADMIN';

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Resumen',
      items: [navItem('/admin', 'Dashboard', ICONS.dashboard, true)],
    },
    ...(isSchool ? [{
      label: 'Mi escuela',
      items: [navItem('/admin/school', 'Perfil de escuela', ICONS.school)],
    }] : []),
    ...(isPlatform ? [{
      label: 'Plataforma',
      items: [
        navItem('/admin/schools',  'Gestión de escuelas', ICONS.schools),
        navItem('/admin/activity', 'Actividad',           ICONS.activity),
      ],
    }] : []),
    {
      label: 'Solicitudes',
      items: [
        navItem('/admin/leads',         'Solicitudes',      ICONS.leads),
        navItem('/admin/trial-classes', 'Clases de prueba', ICONS.trial),
      ],
    },
    {
      label: 'Contenido',
      items: [
        navItem('/admin/programs',    'Programas',   ICONS.programs),
        navItem('/admin/instructors', 'Instructores', ICONS.instructors),
        navItem('/admin/campuses',    'Sedes',        ICONS.campuses),
        navItem('/admin/schedules',   'Horarios',     ICONS.schedules),
        navItem('/admin/media',       'Fotos y reels',ICONS.media),
        navItem('/admin/articles',    'Artículos',    ICONS.articles),
      ],
    },
    {
      label: 'Comunicación',
      items: [
        navItem('/admin/campaigns', 'Campañas', ICONS.campaigns),
        navItem('/admin/events',    'Eventos',  ICONS.events),
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <NavGroup key={g.label} label={g.label} items={g.items} mobile={mobile} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// ─── Role badge ─────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  SCHOOL_ADMIN:    'Escuela',
  PLATFORM_ADMIN:  'Plataforma',
  STUDENT_OR_PARENT: 'Estudiante',
};

// ─── Section labels for mobile header ───────────────────────
const SECTION_LABELS: Record<string, string> = {
  '/admin':              'Dashboard',
  '/admin/school':       'Perfil de escuela',
  '/admin/schools':      'Gestión de escuelas',
  '/admin/leads':        'Solicitudes',
  '/admin/trial-classes':'Clases de prueba',
  '/admin/articles':     'Artículos',
  '/admin/programs':     'Programas',
  '/admin/instructors':  'Instructores',
  '/admin/media':        'Fotos y reels',
  '/admin/campuses':     'Sedes',
  '/admin/schedules':    'Horarios',
  '/admin/events':       'Eventos',
  '/admin/campaigns':    'Campañas',
  '/admin/activity':     'Actividad',
};

// ─── Main layout ────────────────────────────────────────────
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sectionLabel = SECTION_LABELS[location.pathname] ?? 'Panel';

  return (
    <div className="flex min-h-screen bg-[#f3fcf3]">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#dfeadf] bg-white md:flex">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
          {/* User info */}
          <div className="border-b border-[#dfeadf] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f5ec] text-sm font-black text-[#006b2d]">
                {user?.firstName?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#151d18]">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-[#7a887b]">{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Navegación del panel">
            <NavContent />
          </nav>

          {/* Footer actions */}
          <div className="border-t border-[#dfeadf] px-3 py-4 space-y-1">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#5f6d61] transition hover:bg-[#f3fcf3] hover:text-[#006b2d]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver sitio público
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-[#dfeadf] bg-white px-4 py-3 md:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7a887b]">Panel</p>
            <p className="text-base font-bold text-[#151d18]">{sectionLabel}</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú del panel"
            aria-expanded={drawerOpen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce8dc] bg-white text-[#5f6d61]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">
            <Routes>
              <Route index          element={<DashboardPage />}      />
              <Route path="school"       element={<SchoolProfileAdmin />}  />
              <Route path="schools"      element={<SchoolsAdmin />}        />
              <Route path="leads"        element={<LeadsAdmin />}          />
              <Route path="trial-classes"element={<TrialClassesAdmin />}   />
              <Route path="articles"     element={<ArticlesAdmin />}       />
              <Route path="programs"     element={<ProgramsAdmin />}       />
              <Route path="instructors"  element={<InstructorsAdmin />}    />
              <Route path="media"        element={<MediaAdmin />}          />
              <Route path="campuses"     element={<CampusesAdmin />}       />
              <Route path="schedules"    element={<SchedulesAdmin />}      />
              <Route path="events"       element={<EventsAdmin />}         />
              <Route path="campaigns"    element={<CampaignsAdmin />}      />
              <Route path="activity"     element={<ActivityAdmin />}       />
            </Routes>
          </div>
        </main>
      </div>

      {/* ── Mobile drawer overlay ── */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú del panel"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-[#dfeadf] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f5ec] text-sm font-black text-[#006b2d]">
              {user?.firstName?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#151d18]">{user?.firstName}</p>
              <p className="text-xs text-[#7a887b]">{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce8dc] text-[#5f6d61]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Navegación mobile del panel">
          <NavContent mobile onNavigate={() => setDrawerOpen(false)} />
        </nav>

        {/* Drawer footer */}
        <div className="border-t border-[#dfeadf] px-3 py-4 space-y-1">
          <Link
            to="/"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#5f6d61] hover:bg-[#f3fcf3] hover:text-[#006b2d]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver sitio público
          </Link>
          <button
            onClick={() => { logout(); setDrawerOpen(false); }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </div>
  );
}
