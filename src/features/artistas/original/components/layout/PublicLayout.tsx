import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, UserCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { YebaamLogo } from "../brand/YebaamLogo";

const navItems: [string, string][] = [
  ["/artists",       "Artistas"],
  ["/portfolio",     "Portafolio"],
  ["/opportunities", "Oportunidades"],
  ["/events",        "Eventos"],
  ["/campaigns",     "Campañas"],
  ["/articles",      "Artículos"]
];

const actionLinkBase =
  "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2";
const ghostActionLink = `${actionLinkBase} text-brand-muted hover:bg-brand-mintLight hover:text-brand-ink`;
const primaryActionLink = `${actionLinkBase} bg-brand-greenDark text-white shadow-green hover:bg-brand-greenDeep`;
const panelActionLink = `${actionLinkBase} border border-brand-green/45 bg-brand-mintLight text-brand-dark hover:bg-brand-mint`;

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const dashboardPath =
    user?.role === "PLATFORM_ADMIN" ? "/admin/dashboard" :
    user?.role === "MANAGER"        ? "/manager/dashboard" :
    user?.role === "ARTIST"         ? "/artist/dashboard" : "/me";

  return (
    <div className="min-h-screen bg-brand-bg">

      {/* Skip to main content — visible solo en focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand-greenDark focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-green"
      >
        Saltar al contenido principal
      </a>

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-brand-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">

          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center gap-3 text-brand-ink" aria-label="Yebaam PerfilArtístico — inicio">
            <YebaamLogo title="" className="h-8 w-[126px] shrink-0 text-brand-greenDark" />
            <span className="hidden border-l border-brand-border pl-3 text-sm font-black leading-tight text-brand-ink sm:block">
              PerfilArtístico
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navegación principal">
            {navItems.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-mintLight text-brand-greenDark"
                      : "text-brand-muted hover:bg-brand-bgGreen hover:text-brand-ink"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath} className={panelActionLink}>
                  <UserCircle size={16} aria-hidden="true" />
                  Mi panel
                </Link>
                <Button variant="ghost" size="sm" icon={<LogOut size={16} />} onClick={logout}>Salir</Button>
              </>
            ) : (
              <>
                <Link to="/login" className={ghostActionLink}>Ingresar</Link>
                <Link to="/register" className={primaryActionLink}>Crear perfil</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border text-brand-muted transition hover:bg-brand-bgGreen md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            id="mobile-nav"
            className="border-t border-brand-border bg-white px-4 pb-4 pt-3 md:hidden animate-slide-up"
          >
            <nav className="flex flex-col gap-1" aria-label="Navegación mobile">
              {navItems.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive ? "bg-brand-mintLight text-brand-greenDark" : "text-brand-muted hover:bg-brand-bgGreen"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-brand-border pt-3">
              {isAuthenticated ? (
                <>
                  <Link to={dashboardPath} onClick={() => setOpen(false)} className={`${panelActionLink} w-full`}>
                    <UserCircle size={16} aria-hidden="true" />
                    Mi panel
                  </Link>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { logout(); setOpen(false); }}>Cerrar sesión</Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className={`${ghostActionLink} w-full`}>Ingresar</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className={`${primaryActionLink} w-full`}>Crear perfil artístico</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-brand-dark text-white" aria-label="Pie de página">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <YebaamLogo title="" className="h-8 w-[126px] text-white" />
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-brand-greenSoft">PerfilArtístico</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/60 max-w-xs">
                Plataforma cultural para perfiles artísticos profesionales, portafolios, oportunidades y gestión de talento creativo en Colombia y Latinoamérica.
              </p>
              <div className="mt-5 flex gap-2">
                <span className="inline-flex items-center rounded-full bg-brand-green/20 px-3 py-1 text-xs font-semibold text-brand-greenSoft">Artistas</span>
                <span className="inline-flex items-center rounded-full bg-brand-orange/20 px-3 py-1 text-xs font-semibold text-brand-orange">Oportunidades</span>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">Comunidad</span>
              </div>
            </div>

            {/* Explorar */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-greenSoft">Explorar</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                {navItems.map(([to, label]) => (
                  <li key={to}><Link to={to} className="transition hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Cuenta */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-greenSoft">Cuenta</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                <li><Link to="/login" className="transition hover:text-white">Ingresar</Link></li>
                <li><Link to="/register" className="transition hover:text-white">Crear perfil</Link></li>
              </ul>
            </div>

            {/* Plataforma */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-greenSoft">Plataforma</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                <li><span>Colombia y Latinoamérica</span></li>
                <li><span>Talento creativo</span></li>
                <li><span>Marca personal artística</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} PerfilArtístico. Todos los derechos reservados.</p>
            <p className="text-xs text-white/40">Construido con identidad de marca Yebaam.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
