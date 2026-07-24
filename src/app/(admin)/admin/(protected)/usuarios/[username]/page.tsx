import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import UserAvatar from '@/features/foro/components/UserAvatar'
import {
  getAdminUserAuthIdentity,
  getAdminUserDetailByUsername,
} from '@/features/admin/server/user-detail.server'
import { getOccupationDistribution } from '@/features/admin/server/occupation-stats.server'
import { OccupationContextChart } from '@/features/admin/components/charts/OccupationContextChart'
import { WorkVerificationToggle } from '@/features/admin/components/users/WorkVerificationToggle'
import { CopyableText } from '@/features/admin/components/users/CopyableText'
import { ArrowTopRightOnSquareIcon, CheckBadgeIcon } from '@/components/icons/heroicons-shim'
import { withAdminView } from '@/lib/auth/admin-view'
import { occupationLabel } from '@/features/auth/constants/occupations'

export const metadata = { title: 'Admin · Detalle de usuario' }

interface PageProps {
  params: Promise<{ username: string }>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function genderLabel(g: string | null): string {
  if (!g) return '—'
  const map: Record<string, string> = { FEMALE: 'Mujer', MALE: 'Hombre', OTHER: 'Otro' }
  return map[g.toUpperCase()] ?? g
}

function providerLabel(p: string | null): string {
  if (!p) return '—'
  const map: Record<string, string> = { email: 'Email y contraseña', google: 'Google', phone: 'Teléfono' }
  return map[p] ?? p
}

function verificationLabel(v: string | null): { label: string; tone: string } {
  switch (v) {
    case 'approved':
      return { label: 'Aprobada', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }
    case 'pending':
      return { label: 'Pendiente', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
    case 'rejected':
      return { label: 'Rechazada', tone: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
    default:
      return { label: 'Sin iniciar', tone: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' }
  }
}

interface FieldProps {
  label: string
  value: React.ReactNode
}

function Field({ label, value }: FieldProps) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{isEmpty ? '—' : value}</dd>
    </div>
  )
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { username } = await params
  const [user, distribution] = await Promise.all([
    getAdminUserDetailByUsername(username),
    getOccupationDistribution(),
  ])
  if (!user) notFound()

  // Registration email lives in `auth.users` and is platform-admin-only, so it
  // is fetched separately (returns null for forum moderators).
  const authIdentity = await getAdminUserAuthIdentity(user.id)

  const fullName = [user.firstName, user.middleName, user.lastName, user.secondLastName]
    .filter(Boolean)
    .join(' ')
    .trim() || user.displayName || '—'

  const verification = verificationLabel(user.verificationStatus)
  const author = {
    id: user.id,
    username: user.username ?? 'usuario',
    displayName: user.displayName || fullName || 'Usuario',
    avatarUrl: user.avatarUrl,
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-4 text-xs text-neutral-500">
        <Link
          href={'/admin/usuarios' as Route}
          className="hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          ← Volver a Usuarios
        </Link>
      </nav>

      <header className="mb-6 flex flex-col items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900">
        <UserAvatar author={author} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {fullName}
          </h1>
          <p className="text-sm text-neutral-500">@{user.username ?? 'usuario'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {occupationLabel(user.occupation)}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verification.tone}`}>
              Verificación: {verification.label}
            </span>
            {user.pioneerNumber != null && (
              <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                Pionero #{user.pioneerNumber}
              </span>
            )}
          </div>
        </div>
        {/* `?adminView=1` is the proxy's escape hatch: without it an admin
            session gets bounced back to /admin/* on any non-admin route.
            Opens in a new tab so the admin keeps this detail page open. */}
        <Link
          href={withAdminView(`/${user.username ?? ''}`) as Route}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Ver perfil público
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Información general
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" value={fullName} />
            <Field label="Ocupación" value={occupationLabel(user.occupation)} />
            <Field label="Género" value={genderLabel(user.gender)} />
            <Field label="Fecha de nacimiento" value={formatDate(user.birthDate)} />
            <Field label="Teléfono" value={user.phoneNumber} />
            <Field
              label="Empresa"
              value={
                user.workPlace ? (
                  <span className="inline-flex items-center gap-1">
                    {user.workPlace}
                    {user.workVerified && (
                      <CheckBadgeIcon className="h-4 w-4 text-sky-500" title="Empleo autenticado" />
                    )}
                  </span>
                ) : null
              }
            />
            <Field label="Puesto" value={user.workPosition} />
            <Field label="Estudió en" value={user.studyPlace} />
            <Field
              label="Idiomas"
              value={user.languages.length > 0 ? user.languages.join(', ') : null}
            />
            <Field
              label="Intereses"
              value={user.interests.length > 0 ? user.interests.join(', ') : null}
            />
          </dl>
          {user.bio && (
            <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Bio
              </dt>
              <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">{user.bio}</dd>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Ubicación
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <Field label="País" value={user.country} />
            <Field label="Departamento" value={user.state} />
            <Field label="Ciudad" value={user.city} />
          </dl>

          <h2 className="mt-6 mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Cuenta
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            {authIdentity && (
              <>
                <Field
                  label="Email de registro"
                  value={
                    authIdentity.email ? (
                      <CopyableText
                        value={authIdentity.email}
                        href={`mailto:${authIdentity.email}`}
                        label="Copiar email"
                      />
                    ) : null
                  }
                />
                <Field
                  label="Email confirmado"
                  value={
                    authIdentity.emailConfirmedAt ? (
                      formatDateTime(authIdentity.emailConfirmedAt)
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Sin confirmar</span>
                    )
                  }
                />
                <Field label="Método de acceso" value={providerLabel(authIdentity.provider)} />
                <Field
                  label="Último inicio de sesión"
                  value={formatDateTime(authIdentity.lastSignInAt)}
                />
              </>
            )}
            <Field label="Alta" value={formatDate(user.createdAt)} />
            <Field label="Última actividad" value={formatDateTime(user.lastActiveAt)} />
            <Field label="Términos aceptados" value={formatDateTime(user.termsAcceptedAt)} />
            <Field label="Perfil completo" value={user.profileCompleted ? 'Sí' : 'No'} />
          </dl>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Actividad
          </h2>
          <dl className="grid grid-cols-3 gap-4">
            <Field label="Amigos" value={user.friendsCount ?? 0} />
            <Field label="Seguidores" value={user.followersCount ?? 0} />
            <Field label="Posts" value={user.postsCount ?? 0} />
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Autenticación de empleo
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Otorga el chulito de empleo verificado sin necesidad de documentos.
        </p>
        <dl className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Ocupación" value={occupationLabel(user.occupation)} />
          <Field label="Empresa" value={user.workPlace} />
          <Field label="Puesto" value={user.workPosition} />
        </dl>
        <WorkVerificationToggle
          userId={user.id}
          verified={Boolean(user.workVerified)}
          workPlace={user.workPlace}
          workPosition={user.workPosition}
          verifiedAt={user.workVerifiedAt}
        />
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Contexto: este usuario dentro de la distribución global
        </h2>
        <p className="mb-3 text-xs text-neutral-500">
          {user.occupation
            ? `La barra resaltada corresponde a "${occupationLabel(user.occupation)}".`
            : 'Este usuario aún no especifica ocupación.'}
        </p>
        <OccupationContextChart data={distribution} highlightSlug={user.occupation} />
      </section>
    </div>
  )
}
