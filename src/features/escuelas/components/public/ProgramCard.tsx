import Link from 'next/link'
import Image from 'next/image'
import type { Program } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  program: Program
}

export function ProgramCard({ program }: Props) {
  const imgUrl = program.cf_image_id
    ? `https://imagedelivery.net/${CF_HASH}/${program.cf_image_id}/public`
    : null

  return (
    <Link href={`/programas/${program.id}` as never} className="group block rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
      {imgUrl && (
        <div className="relative aspect-video bg-muted">
          <Image src={imgUrl} alt={program.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 350px" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary">{program.name}</h3>
        <div className="flex gap-2 mt-1">
          <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">{program.modality.toLowerCase()}</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">{program.level.toLowerCase()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{program.short_description}</p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-semibold">{program.currency} {program.monthly_price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mes</span></p>
          {program.trial_class_available && (
            <span className="text-xs text-primary">Clase de prueba</span>
          )}
        </div>
      </div>
    </Link>
  )
}
