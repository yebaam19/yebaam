import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/',          label: 'Inicio',    end: true  },
  { to: '/schools',   label: 'Escuelas',  end: false },
  { to: '/programs',  label: 'Cursos',    end: false },
  { to: '/campaigns', label: 'Campañas',  end: false },
  { to: '/events',    label: 'Eventos',   end: false },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() { setMenuOpen(false); }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#dfeadf] bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3 md:px-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-[#006b2d]"
            onClick={closeMenu}
            aria-label="YEBAAM Escuelas — Inicio"
          >
            <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#006b2d" />
              <path d="M8 22V12l8-4 8 4v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 22v-5h6v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="14" r="2" fill="#fff" />
            </svg>
            <span className="text-lg font-black tracking-tight text-[#151d18]">
              YEBAAM <span className="font-medium text-[#5f6d61]">Escuelas</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#e8f5ec] text-[#006b2d]'
                      : 'text-[#2f3d32] hover:bg-[#f3fcf3] hover:text-[#006b2d]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/admin"
                  className="hidden items-center gap-2 rounded-lg border border-[#dce8dc] bg-white px-4 py-2 text-sm font-semibold text-[#2f3d32] transition hover:border-[#006b2d] hover:text-[#006b2d] md:inline-flex"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                  {user.firstName}
                </Link>
                <button
                  onClick={logout}
                  className="hidden rounded-lg border border-[#dce8dc] bg-white px-4 py-2 text-sm font-semibold text-[#2f3d32] transition hover:bg-red-50 hover:border-red-200 hover:text-red-600 md:inline-flex"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-lg border border-[#dce8dc] bg-white px-4 py-2 text-sm font-semibold text-[#2f3d32] transition hover:border-[#006b2d] hover:text-[#006b2d] md:inline-flex"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="hidden items-center gap-1.5 rounded-lg bg-[#006b2d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#005723] md:inline-flex"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar escuela
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce8dc] bg-white text-[#2f3d32] transition hover:bg-[#f3fcf3] md:hidden"
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-white transition-transform duration-300 md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-[#dfeadf] px-5 py-3">
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#006b2d" />
              <path d="M8 22V12l8-4 8 4v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 22v-5h6v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="14" r="2" fill="#fff" />
            </svg>
            <span className="text-base font-black text-[#151d18]">YEBAAM <span className="font-medium text-[#5f6d61]">Escuelas</span></span>
          </Link>
          <button
            onClick={closeMenu}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce8dc] text-[#5f6d61]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Menú mobile">
          <div className="space-y-1">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#006b2d] text-white'
                      : 'text-[#2f3d32] hover:bg-[#f3fcf3]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Auth section */}
        <div className="border-t border-[#dfeadf] px-4 py-5 space-y-2">
          {isAuthenticated && user ? (
            <>
              <p className="px-1 text-xs text-[#7a887b]">
                Conectado como <strong className="text-[#151d18]">{user.firstName} {user.lastName}</strong>
              </p>
              <Link
                to="/admin"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-xl border border-[#dce8dc] bg-white px-4 py-3 text-sm font-semibold text-[#2f3d32] transition hover:bg-[#f3fcf3]"
              >
                <svg className="h-4 w-4 text-[#006b2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                </svg>
                Panel de administración
              </Link>
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="w-full rounded-xl border border-[#dce8dc] bg-white px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
                className="block rounded-xl border border-[#dce8dc] bg-white px-4 py-3 text-center text-sm font-semibold text-[#2f3d32] transition hover:bg-[#f3fcf3]"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="block rounded-xl bg-[#006b2d] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#005723]"
              >
                Registrar mi escuela
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
