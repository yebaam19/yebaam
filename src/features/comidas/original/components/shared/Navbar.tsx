import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBars, FaChevronRight, FaXmark } from 'react-icons/fa6'
import Button from '../ui/Button'
import BrandLogo from './BrandLogo'
import { clearAuthSession, isAuthenticated } from '../../lib/session'

export interface NavbarLink {
  label: string
  href: string
  isActive?: boolean
}

export interface NavbarProps {
  brandName?: string
  brandHref?: string
  links?: NavbarLink[]
  onLogin?: () => void
  onRegister?: () => void
  onMenuToggle?: () => void
  rightSlot?: ReactNode
  showAuthActions?: boolean
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar({
  brandName = 'Yebaam',
  brandHref = '/',
  links = [
    { label: 'Inicio', href: '#' },
    { label: 'Negocios', href: '#negocios' },
    { label: 'Ofertas', href: '#promociones' },
    { label: 'Cómo funciona', href: '#como-funciona' },
  ],
  onLogin,
  onRegister,
  onMenuToggle,
  rightSlot,
  showAuthActions = true,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const authenticated = isAuthenticated()

  const handleToggleMenu = () => {
    setMobileMenuOpen((current) => !current)
    onMenuToggle?.()
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    clearAuthSession()
    closeMobileMenu()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[color:rgba(15,23,42,0.08)] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <a href={brandHref} className="flex items-center gap-3" aria-label={brandName}>
            <BrandLogo variant="green" className="h-10 w-auto sm:h-11" />
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition',
                  link.isActive
                    ? 'text-[var(--brand-green-700)]'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {rightSlot}
            {authenticated ? (
              <Button variant="ghost" onClick={handleLogout}>
                Salir
              </Button>
            ) : showAuthActions ? (
              <>
                <Button variant="ghost" onClick={onLogin} leftIcon={<FaChevronRight />}>
                  Iniciar sesión
                </Button>
                <Button onClick={onRegister} rightIcon={<FaChevronRight />}>
                  Unirme
                </Button>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleToggleMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:rgba(15,23,42,0.08)] bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navbar-menu"
          >
            {mobileMenuOpen ? <FaXmark /> : <FaBars />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div
            id="mobile-navbar-menu"
            className="border-t border-slate-200 bg-white pb-4 pt-3 md:hidden"
          >
            <nav className="grid gap-1">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'rounded-2xl px-3 py-3 text-sm font-medium transition',
                    link.isActive
                      ? 'bg-[var(--brand-green-50)] text-[var(--brand-green-800)]'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-4 space-y-3">
              {rightSlot ? <div onClick={closeMobileMenu}>{rightSlot}</div> : null}
              {authenticated ? (
                <Button variant="ghost" onClick={handleLogout} fullWidth>
                  Salir
                </Button>
              ) : showAuthActions ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="ghost" onClick={onLogin} leftIcon={<FaChevronRight />}>
                    Iniciar sesión
                  </Button>
                  <Button onClick={onRegister} rightIcon={<FaChevronRight />}>
                    Unirme
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
