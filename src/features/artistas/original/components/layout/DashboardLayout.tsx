import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, ExternalLink, ChevronRight, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { useAuth } from "../../contexts/AuthContext";
import { YebaamLogo } from "../brand/YebaamLogo";

export type DashboardNavItem = { to: string; label: string; icon?: string };

export function DashboardLayout({ title, items }: { title: string; items: DashboardNavItem[] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-brand-dark text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <Link to="/" className="flex flex-col items-start gap-1.5" aria-label="PerfilArtístico — ir al inicio">
          <YebaamLogo title="" className="h-8 w-[126px] text-white" />
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-brand-mintLight">PerfilArtístico</span>
        </Link>
      </div>

      {/* Role label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-greenSoft">{title}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5" aria-label={`Navegación ${title}`}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-green text-white shadow-green"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-70" aria-hidden="true" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <Avatar name={user?.displayName} className="h-8 w-8 shrink-0 text-sm" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.displayName}</p>
            <p className="text-xs text-white/50" aria-label={`Rol: ${user?.role}`}>{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg">

      {/* Skip link */}
      <a
        href="#panel-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand-greenDark focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-green"
      >
        Saltar al contenido del panel
      </a>

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 hidden w-64 lg:block shadow-card overflow-hidden"
        aria-label={`Panel lateral — ${title}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={`Menú — ${title}`}>
          <div
            className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-card overflow-hidden animate-slide-up">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-brand-border bg-white/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border text-brand-muted transition hover:bg-brand-bgGreen lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú de navegación"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{title}</p>
                <p className="text-sm font-bold text-brand-ink">{user?.displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<ExternalLink size={15} aria-hidden="true" />}
                onClick={() => navigate("/")}
                aria-label="Ver sitio público"
              >
                <span className="hidden sm:inline">Ver sitio</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<LogOut size={15} aria-hidden="true" />}
                onClick={logout}
                aria-label="Cerrar sesión"
              >
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>

          {/* Mobile nav tabs */}
          <nav id="mobile-nav" className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden" aria-label="Navegación rápida">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    isActive ? "bg-brand-greenDark text-white" : "bg-brand-bgGreen text-brand-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main id="panel-content" className="mx-auto max-w-7xl px-4 py-7 sm:px-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
