import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import type {
  AdminCityDetail,
  CityAdminRow,
} from '@/features/admin/server/cities.server'
import { AddAdminForm } from './AddAdminForm'
import { RevokeAdminButton } from './RevokeAdminButton'

interface Props {
  city: AdminCityDetail
  admins: CityAdminRow[]
}

export async function CityAdminsList({ city, admins }: Props) {
  const t = await getTranslations('admin.ciudades')
  const tDate = await getTranslations('admin.ciudades')
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('adminsHeading')}
          </h2>
          <p className="text-xs text-neutral-500">{t('adminsSubtitle')}</p>
        </header>
        {admins.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {t('noAdmins')}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {admins.map((a) => (
              <li key={a.userId} className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  {a.user.avatarUrl ? (
                    <Image
                      src={a.user.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="h-9 w-9 object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {a.user.displayName ?? a.user.username ?? '—'}
                  </div>
                  <div className="text-xs text-neutral-500">
                    @{a.user.username ?? '—'} · {t(roleKey(a.role))} ·{' '}
                    {tDate('adminGrantedAt')}{' '}
                    {new Date(a.grantedAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
                {a.user.username && (
                  <Link
                    href={`/admin/usuarios/${a.user.username}` as Route}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    @{a.user.username}
                  </Link>
                )}
                <RevokeAdminButton cityId={city.id} userId={a.userId} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('addAdminHeading')}
          </h2>
        </header>
        <AddAdminForm cityId={city.id} />
      </section>
    </div>
  )
}

function roleKey(role: CityAdminRow['role']): 'adminRoleOwner' | 'adminRoleFranchise' | 'adminRoleContractor' {
  switch (role) {
    case 'owner':
      return 'adminRoleOwner'
    case 'franchise':
      return 'adminRoleFranchise'
    case 'contractor':
      return 'adminRoleContractor'
  }
}
