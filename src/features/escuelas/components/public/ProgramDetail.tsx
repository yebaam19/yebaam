import Image from 'next/image'
import type { ProgramDetail } from '../../types'
import { LeadForm } from './LeadForm'
import { TrialClassForm } from './TrialClassForm'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  program: ProgramDetail
}

export function ProgramDetail({ program }: Props) {
  const imgUrl = program.cf_image_id
    ? `https://imagedelivery.net/${CF_HASH}/${program.cf_image_id}/public`
    : null

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {imgUrl && (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-100 mb-6">
          <Image src={imgUrl} alt={program.name} fill className="object-cover" sizes="768px" priority />
        </div>
      )}
      <h1 className="text-2xl font-bold mb-2">{program.name}</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-neutral-100 px-2 py-1 rounded capitalize">{program.modality.toLowerCase()}</span>
        <span className="text-xs bg-neutral-100 px-2 py-1 rounded capitalize">{program.level.toLowerCase()}</span>
        <span className="text-xs bg-neutral-100 px-2 py-1 rounded">{program.age_range}</span>
      </div>
      <p className="text-xl font-bold text-primary-700 mb-4">
        {program.currency} {program.monthly_price.toLocaleString()}<span className="text-sm font-normal text-neutral-500"> / mes</span>
      </p>
      <p className="text-neutral-500 mb-6 whitespace-pre-line">{program.description}</p>
      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div className="border border-neutral-200 rounded-lg p-3">
          <p className="text-xs text-neutral-500">Duración</p>
          <p className="font-medium">{program.duration}</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3">
          <p className="text-xs text-neutral-500">Horario</p>
          <p className="font-medium">{program.schedule_summary}</p>
        </div>
      </div>

      <div className="space-y-6">
        <LeadForm schoolId={program.school_id} programId={program.id} />
        {program.trial_class_available && (
          <TrialClassForm schoolId={program.school_id} programId={program.id} />
        )}
      </div>
    </main>
  )
}
