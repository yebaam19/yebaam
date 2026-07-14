import Link from 'next/link'
import Image from 'next/image'
import type { Program } from '../../types'
import { cfImageUrl } from '@/lib/cloudflare'

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial',
  VIRTUAL:    'Virtual',
  HYBRID:     'Híbrido',
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER:     'Inicial',
  INTERMEDIATE: 'Intermedio',
  ADVANCED:     'Avanzado',
  PROFESSIONAL: 'Profesional',
}

function formatPrice(price: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(price)
}

interface Props { program: Program }

export function ProgramCard({ program }: Props) {
  const imgUrl = cfImageUrl(program.cf_image_id)

  return (
    <Link
      href={`/programas/${program.id}` as never}
      className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-950/5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
    >
      <div className="relative aspect-video overflow-hidden bg-primary-50">
        {imgUrl ? (
          <Image src={imgUrl} alt={program.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 350px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-50 to-neutral-100">
            <span className="text-3xl opacity-40" aria-hidden="true">🎓</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
            {MODALITY_LABELS[program.modality] ?? program.modality}
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
            {LEVEL_LABELS[program.level] ?? program.level}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-neutral-950 group-hover:text-primary-700 transition-colors">
          {program.name}
        </h3>

        {program.short_description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
            {program.short_description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-black text-neutral-950">
              {formatPrice(program.monthly_price, program.currency)}
            </span>
            <span className="text-xs text-neutral-400">/mes</span>
          </div>
          {program.trial_class_available && (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              Clase de prueba
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
