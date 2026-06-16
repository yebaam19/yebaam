import Image from 'next/image'
import { Users } from 'lucide-react'
import { cfImageUrl } from './SchoolHero'
import type { Instructor } from '../../../types'

interface Props { instructors: Instructor[] }

export function SchoolInstructorsTab({ instructors }: Props) {
  const active = instructors.filter((i) => i.is_active !== false)

  if (active.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-200 bg-white p-10 text-center">
        <Users size={36} className="mx-auto text-primary-300" aria-hidden="true" />
        <p className="mt-3 text-base font-black text-neutral-950">Sin docentes publicados</p>
        <p className="mt-2 text-sm text-neutral-500">La escuela todavía no tiene instructores activos.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {active.map((instructor) => (
        <InstructorCard key={instructor.id} instructor={instructor} />
      ))}
    </div>
  )
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const photoUrl = cfImageUrl(instructor.photo_cf_image_id)
  const initials = instructor.name.charAt(0).toUpperCase()

  return (
    <article className="rounded-xl border border-primary-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Photo */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-50">
        {photoUrl ? (
          <Image src={photoUrl} alt={instructor.name} width={80} height={80} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl font-black text-primary-700">{initials}</span>
        )}
      </div>

      {/* Info */}
      <h3 className="mt-4 font-black text-neutral-950">{instructor.name}</h3>
      <p className="mt-1 text-sm text-neutral-500">{instructor.specialties}</p>
      {instructor.bio && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">{instructor.bio}</p>
      )}

      {/* Instagram link */}
      {instructor.instagram && (
        <a href={`https://instagram.com/${instructor.instagram.replace('@', '')}`}
          target="_blank" rel="noreferrer"
          className="mt-4 inline-block text-xs font-bold text-primary-700 hover:underline">
          @{instructor.instagram.replace('@', '')}
        </a>
      )}

      <button type="button"
        className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-primary-100 bg-white text-sm font-bold text-neutral-700 transition hover:border-primary-700 hover:text-primary-700">
        Ver perfil
      </button>
    </article>
  )
}
