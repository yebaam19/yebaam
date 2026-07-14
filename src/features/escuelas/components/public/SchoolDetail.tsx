'use client'

import { useState } from 'react'
import { useOptionalCurrentUser } from '@/features/auth/context/current-user.context'
import { GraduationCap, BookOpen, Users, Star } from 'lucide-react'
import type { SchoolDetail as TSchoolDetail } from '../../types'
import { SchoolHero } from './detail/SchoolHero'
import { SchoolTabNav, type SchoolTab } from './detail/SchoolTabNav'
import { SchoolProgramsTab } from './detail/SchoolProgramsTab'
import { SchoolInstructorsTab } from './detail/SchoolInstructorsTab'
import { SchoolGallery } from './detail/SchoolGallery'
import { SchoolReviewsTab } from './detail/SchoolReviewsTab'
import { SchoolContactTab } from './detail/SchoolContactTab'
import { LeadFormModal, TrialClassFormModal } from './detail/SchoolForms'

type FormKind = 'lead' | 'trial' | null

interface Props { school: TSchoolDetail; isAdmin?: boolean }

export function SchoolDetail({ school, isAdmin = false }: Props) {
  const [activeTab, setActiveTab] = useState<SchoolTab>('programas')
  const [activeForm, setActiveForm] = useState<FormKind>(null)
  const currentUser = useOptionalCurrentUser()
  const initialName = currentUser?.displayName
  const initialEmail = currentUser?.email

  const programs = (school.programs ?? []).filter((p) => p.is_active !== false)
  const instructors = (school.instructors ?? []).filter((i) => i.is_active !== false)
  const assets = school.media_assets ?? []
  const reviews = (school.reviews ?? []).filter((r) => r.is_published !== false)
  const galleryImages = assets.filter((a) => a.cf_image_id && !['VIDEO_URL', 'VIDEO', 'REEL'].includes(a.type))

  const counts: Partial<Record<SchoolTab, number>> = {
    programas: programs.length,
    instructores: instructors.length,
    galeria: galleryImages.length,
    resenas: reviews.length,
  }

  return (
    <>
      <div className="min-h-screen bg-primary-50/60 pb-16">
        {/* Hero */}
        <SchoolHero
          school={school}
          isAdmin={isAdmin}
          onLeadForm={() => setActiveForm('lead')}
          onTrialForm={() => setActiveForm('trial')}
        />

        {/* Stats row */}
        <section className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <GraduationCap size={22} />, label: school.is_verified ? 'Escuela verificada' : 'Perfil activo' },
              { icon: <BookOpen size={22} />, label: `${programs.length} cursos` },
              { icon: <Users size={22} />, label: school.capacity ? `${school.capacity} cupos` : 'Cupos disponibles' },
              { icon: <Star size={22} />, label: `${instructors.length || 1} docentes` },
            ].map(({ icon, label }) => (
              <div key={label} className="rounded-xl border border-primary-100 bg-white p-5 text-center shadow-sm">
                <span className="flex justify-center text-primary-700">{icon}</span>
                <p className="mt-2 text-sm font-black text-neutral-950">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tab nav */}
        <SchoolTabNav active={activeTab} onChange={setActiveTab} counts={counts} />

        {/* Tab content */}
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          {activeTab === 'programas' && (
            <SchoolProgramsTab programs={school.programs ?? []} />
          )}
          {activeTab === 'instructores' && (
            <SchoolInstructorsTab instructors={school.instructors ?? []} />
          )}
          {activeTab === 'galeria' && (
            <SchoolGallery assets={assets} />
          )}
          {activeTab === 'resenas' && (
            <SchoolReviewsTab
              reviews={school.reviews ?? []}
              avgRating={school.avg_rating}
              reviewCount={school.review_count}
              isAuthenticated={!!currentUser}
            />
          )}
          {activeTab === 'contacto' && (
            <SchoolContactTab school={school} onLeadForm={() => setActiveForm('lead')} />
          )}
        </div>

        {/* CTA banner */}
        <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 rounded-2xl border border-primary-700 bg-primary-700 p-6 text-white shadow-xl sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-black">{school.lead_form_title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{school.lead_form_description}</p>
            </div>
            <button onClick={() => setActiveForm('lead')}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-black text-primary-700 transition hover:bg-primary-50">
              {school.primary_cta_label || 'Más información'}
            </button>
          </div>
        </section>
      </div>

      {/* Form modals */}
      {activeForm === 'lead' && (
        <LeadFormModal
          schoolId={school.id} schoolName={school.name}
          programs={school.programs ?? []} onClose={() => setActiveForm(null)}
          initialName={initialName} initialEmail={initialEmail}
        />
      )}
      {activeForm === 'trial' && (
        <TrialClassFormModal
          schoolId={school.id} schoolName={school.name}
          programs={school.programs ?? []} onClose={() => setActiveForm(null)}
          initialName={initialName} initialEmail={initialEmail}
        />
      )}
    </>
  )
}
