import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, Clock, Star } from 'lucide-react'
import { cfImageUrl } from '@/lib/cloudflare'
import type { Program } from '../../../types'

const MODALITY_MAP: Record<string, string> = {
  PRESENTIAL: 'Presencial', VIRTUAL: 'Virtual', HYBRID: 'Híbrido',
}
const LEVEL_MAP: Record<string, string> = {
  BEGINNER: 'Inicial', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado', PROFESSIONAL: 'Profesional',
}

function formatPrice(p: Program) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: p.currency, maximumFractionDigits: 0 }).format(p.monthly_price)
}

interface Props { programs: Program[] }

export function SchoolProgramsTab({ programs }: Props) {
  const active = programs.filter((p) => p.is_active !== false)
  if (active.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-200 bg-white p-10 text-center">
        <GraduationCap size={36} className="mx-auto text-primary-300" />
        <p className="mt-3 text-base font-black text-neutral-950">Sin cursos publicados</p>
        <p className="mt-2 text-sm text-neutral-500">Esta escuela todavía no tiene programas activos.</p>
      </div>
    )
  }

  const [featured, ...rest] = active
  const secondary = rest.slice(0, 5)

  return (
    <div className="space-y-5">
      {/* Featured layout */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Featured card */}
        <article className="overflow-hidden rounded-xl border border-primary-100 bg-white shadow-md">
          <div className="grid md:grid-cols-[0.85fr_1fr]">
            <div className="relative min-h-72 bg-primary-50">
              {cfImageUrl(featured.cf_image_id) ? (
                <Image src={cfImageUrl(featured.cf_image_id)!} alt={featured.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" unoptimized />
              ) : (
                <div className="flex h-full min-h-72 items-center justify-center bg-primary-50">
                  <GraduationCap size={48} className="text-primary-300" />
                </div>
              )}
              <span className="absolute left-4 top-4 rounded-full bg-primary-700 px-3 py-1 text-xs font-black text-white">Destacado</span>
            </div>
            <div className="p-5 sm:p-6">
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 border border-primary-100">
                {MODALITY_MAP[featured.modality] ?? featured.modality}
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight text-neutral-950">{featured.name}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">{featured.short_description}</p>
              <div className="mt-5 grid gap-3 text-sm text-neutral-500 sm:grid-cols-2">
                <span className="flex items-center gap-2"><Clock size={14} className="text-primary-700" />{featured.duration}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-primary-700">{LEVEL_MAP[featured.level] ?? featured.level}</span>
                </span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-neutral-400">Precio mensual</p>
                  <p className="text-xl font-black text-neutral-950">{formatPrice(featured)}</p>
                </div>
                <Link href={`/programas/${featured.id}` as never}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-700 px-5 text-sm font-bold text-white transition hover:bg-primary-800">
                  Ver detalle
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Secondary programs */}
        <div className="grid gap-4 content-start">
          {secondary.map((program) => (
            <Link key={program.id} href={`/programas/${program.id}` as never}
              className="grid grid-cols-[88px_1fr] gap-4 overflow-hidden rounded-xl border border-primary-100 bg-white p-3 shadow-sm transition hover:border-primary-700">
              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-primary-50">
                {cfImageUrl(program.cf_image_id) ? (
                  <Image src={cfImageUrl(program.cf_image_id)!} alt={program.name} fill className="object-cover" sizes="88px" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center"><GraduationCap size={24} className="text-primary-300" /></div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-primary-700">{LEVEL_MAP[program.level] ?? program.level}</p>
                <h3 className="mt-1 line-clamp-2 font-black leading-tight text-neutral-950">{program.name}</h3>
                <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-neutral-500">
                  <Star size={11} className="text-amber-500" /> 4.8
                </p>
                <p className="mt-1 text-sm font-black text-neutral-950">{formatPrice(program)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
