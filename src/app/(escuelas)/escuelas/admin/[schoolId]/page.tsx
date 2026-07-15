import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  ArrowRight, BookOpen, Camera, CalendarCheck, CheckCircle2,
  Circle, GraduationCap, Inbox, MapPin,
} from 'lucide-react'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { DashboardStats } from '@/features/escuelas/components/admin/DashboardStats'

interface Props {
  params: Promise<{ schoolId: string }>
}

const QUICK_ACTIONS = [
  {
    label: 'Nuevo programa',
    desc: 'Agrega un curso o taller',
    icon: BookOpen,
    slug: 'programas',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    border: 'border-violet-100',
  },
  {
    label: 'Nuevo instructor',
    desc: 'Presenta a tu equipo',
    icon: GraduationCap,
    slug: 'instructores',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    label: 'Nueva sede',
    desc: 'Registra una ubicación',
    icon: MapPin,
    slug: 'sedes',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    border: 'border-orange-100',
  },
  {
    label: 'Subir fotos',
    desc: 'Enriquece tu galería',
    icon: Camera,
    slug: 'media',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    border: 'border-pink-100',
  },
  {
    label: 'Ver leads',
    desc: 'Gestiona tus contactos',
    icon: Inbox,
    slug: 'leads',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    border: 'border-blue-100',
  },
  {
    label: 'Solicitudes',
    desc: 'Clases de prueba pendientes',
    icon: CalendarCheck,
    slug: 'solicitudes',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    border: 'border-teal-100',
  },
]

export default async function EscuelaAdminDashboardPage({ params }: Props) {
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  const checks = [
    { label: 'Descripción de la escuela', done: school.description.length > 20 },
    { label: 'Foto de portada',           done: !!school.cover_cf_image_id },
    { label: 'Logo / foto de perfil',     done: !!school.profile_cf_image_id },
    { label: 'Redes sociales',            done: !!(school.instagram || school.website || school.facebook) },
    { label: 'Horarios generales',        done: !!school.general_schedule },
  ]
  const doneCount = checks.filter((c) => c.done).length
  const pct = Math.round((doneCount / checks.length) * 100)

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Panel de administración</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">{school.name}</h1>
        {school.city && <p className="mt-0.5 text-sm text-neutral-500">{school.city}</p>}
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        }
      >
        <DashboardStats schoolId={schoolId} />
      </Suspense>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-base font-bold text-neutral-900">Acciones rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ label, desc, icon: Icon, slug, iconBg, iconColor, border }) => (
            <Link
              key={slug}
              href={`/escuelas/admin/${schoolId}/${slug}` as never}
              className="group flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconBg} ${iconColor} ${border}`}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900 transition group-hover:text-primary-700">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">{desc}</p>
              </div>
              <ArrowRight
                size={14}
                className="self-end text-neutral-200 transition group-hover:text-primary-400"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Profile completeness */}
      <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">Perfil completo al {pct}%</h2>
          <Link
            href={`/escuelas/admin/${schoolId}/settings` as never}
            className="text-xs font-semibold text-primary-700 hover:underline"
          >
            Editar →
          </Link>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <ul className="space-y-2.5">
          {checks.map(({ label, done }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              ) : (
                <Circle size={16} className="shrink-0 text-neutral-300" />
              )}
              <span className={done ? 'text-neutral-700' : 'text-neutral-400'}>{label}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
