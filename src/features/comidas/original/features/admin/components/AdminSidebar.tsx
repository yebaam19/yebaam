import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaChartLine, FaStore, FaBoxOpen, FaPhotoFilm, FaBullhorn, FaArrowRightFromBracket } from 'react-icons/fa6'
import BrandLogo from '../../../components/shared/BrandLogo'
import { clearAuthSession, getStoredUser } from '../../../lib/session'

type AdminNavItem = {
  label: string
  to: string
}

const DEFAULT_ITEMS: AdminNavItem[] = [
  { label: 'Resumen', to: '/admin' },
  { label: 'Negocios', to: '/admin/businesses' },
  { label: 'Administradores', to: '/admin/business-admins' },
  { label: 'Actividad', to: '/admin/activity' },
]

const BUSINESS_ADMIN_ITEMS: AdminNavItem[] = [
  { label: 'Resumen', to: '/admin' },
  { label: 'Negocio', to: '/admin/business' },
  { label: 'Productos', to: '/admin/products' },
  { label: 'Galería', to: '/admin/media' },
  { label: 'Promociones', to: '/admin/promotions' },
]

const ITEM_ICONS: Record<string, React.ReactNode> = {
  Resumen: <FaChartLine />,
  Negocios: <FaStore />,
  Administradores: <FaBoxOpen />,
  Actividad: <FaChartLine />,
  Negocio: <FaStore />,
  Productos: <FaBoxOpen />,
  Galería: <FaPhotoFilm />,
  Promociones: <FaBullhorn />,
}

interface AdminSidebarProps {
  items?: AdminNavItem[]
  brandName?: string
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminSidebar({
  items = DEFAULT_ITEMS,
  brandName = 'Panel Yebaam',
}: AdminSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getStoredUser()
  const visibleItems = user?.role === 'ADMIN' ? items : BUSINESS_ADMIN_ITEMS

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
      <div className="mb-6">
        <BrandLogo variant="green" className="h-12 w-auto" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
          Centro de control
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">{brandName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Todo para mantener tu vitrina al día.
        </p>
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/admin' && location.pathname.startsWith(item.to))

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <span className="text-base">{ITEM_ICONS[item.label] ?? <FaStore />}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          <FaArrowRightFromBracket className="mr-2" />
          Salir del panel
        </button>
      </div>
    </aside>
  )
}
