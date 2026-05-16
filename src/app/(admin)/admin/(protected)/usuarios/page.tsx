import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { listActiveUsers } from '@/features/admin/server/users.server'
import UserAvatar from '@/features/foro/components/UserAvatar'
import { occupationLabel } from '@/features/auth/constants/occupations'

export const metadata = { title: 'Admin · Usuarios' }

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = sp.q?.trim() ?? ''
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 25

  const t = await getTranslations('admin.usuarios')

  const { items, total, excludedAdmins } = await listActiveUsers({
    search,
    page,
    pageSize,
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const buildHref = (nextPage: number): Route => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (nextPage > 1) params.set('page', String(nextPage))
    const qs = params.toString()
    return (qs ? `/admin/usuarios?${qs}` : '/admin/usuarios') as Route
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('title')}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('subtitleBase')} {excludedAdmins > 0 ? t('subtitleExcluded', { count: excludedAdmins }) : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {t('totalUsers', { count: total.toLocaleString('es-ES') })}
          </span>
        </div>
      </header>

      <section className="min-w-0 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <form
          action="/admin/usuarios"
          method="get"
          className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder={t('searchPlaceholder')}
              className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm sm:max-w-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500"
            >
              {t('search')}
            </button>
            {search && (
              <Link
                href={'/admin/usuarios' as Route}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t('clear')}
              </Link>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                <th className="px-4 py-2">{t('columnUser')}</th>
                <th className="px-4 py-2">{t('columnUsername')}</th>
                <th className="px-4 py-2">{t('columnOccupation')}</th>
                <th className="px-4 py-2">{t('columnSignup')}</th>
                <th className="px-4 py-2 text-right">{t('columnActions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    {search ? t('emptyNoResults') : t('emptyNoUsers')}
                  </td>
                </tr>
              ) : (
                items.map(({ user, createdAt, occupation }) => (
                  <tr
                    key={user.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 dark:border-neutral-800 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar author={user} className="h-9 w-9" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                            {user.displayName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">@{user.username}</td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{occupationLabel(occupation)}</td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{formatDate(createdAt)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/usuarios/${user.username}` as Route}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        {t('viewProfile')}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav
            aria-label={t('paginationLabel')}
            className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800"
          >
            <span>
              {t('pageOf', { page, totalPages })}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildHref(page - 1)}
                  className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {t('previous')}
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildHref(page + 1)}
                  className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {t('next')}
                </Link>
              )}
            </div>
          </nav>
        )}
      </section>
    </div>
  )
}
