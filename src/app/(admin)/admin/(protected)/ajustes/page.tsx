import Link from 'next/link'
import type { Route } from 'next'
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim'
import { listPlatformAdmins } from '@/app/(app)/foro/server/admin.server'
import UserAvatar from '@/features/foro/components/UserAvatar'
import ThemeSettings from '@/features/admin/components/ThemeSettings'

export const metadata = { title: 'Admin · Ajustes' }

interface ShortcutCardProps {
  href: Route
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

function ShortcutCard({ href, label, description, icon: Icon }: ShortcutCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-900/60 dark:hover:bg-primary-900/10"
    >
      <span className="inline-flex rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300">
          {label}
        </div>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
    </Link>
  )
}

export default async function AdminAjustesPage() {
  const admins = await listPlatformAdmins()

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ajustes</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Administradores de la plataforma y accesos directos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <ThemeSettings />

          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Administradores de plataforma
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Cuentas con acceso total al panel y a toda la plataforma.
                </p>
              </div>
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {admins.length}
              </span>
            </header>
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {admins.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-neutral-500">
                  Sin administradores de plataforma todavía.
                </li>
              ) : (
                admins.map((admin) => (
                  <li
                    key={admin.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                  >
                    <UserAvatar author={admin} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {admin.displayName}
                      </div>
                      <div className="truncate text-xs text-neutral-500">@{admin.username}</div>
                    </div>
                    <Link
                      href={`/${admin.username}` as Route}
                      className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      Ver perfil
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <footer className="border-t border-neutral-200 bg-neutral-50/50 px-5 py-3 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40">
              La lista se gestiona desde la tabla <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[10px] dark:bg-neutral-800">platform_admins</code>.
            </footer>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Atajos
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Ir a otras secciones del panel.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <ShortcutCard
                href={'/admin/foros' as Route}
                label="Foros"
                description="Espacios, permisos y moderación de temas."
                icon={ChatBubbleLeftRightIcon}
              />
              <ShortcutCard
                href={'/admin/usuarios' as Route}
                label="Usuarios"
                description="Listado de usuarios activos."
                icon={UsersIcon}
              />
              <ShortcutCard
                href={'/admin' as Route}
                label="Dashboard"
                description="Resumen de la plataforma."
                icon={Cog6ToothIcon}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
