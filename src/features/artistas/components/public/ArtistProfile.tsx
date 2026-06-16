'use client'

import { useState } from 'react'
import { Calendar, Award, BookOpen } from 'lucide-react'
import type { ArtistProfileDetail } from '../../types'
import { ArtistHeader } from './detail/ArtistHeader'
import { ArtistPortfolio } from './detail/ArtistPortfolio'
import { ArtistSidebar } from './detail/ArtistSidebar'
import { ContactFormModal, BookingFormModal, CollaborationFormModal } from './detail/ArtistForms'
import { useOptionalCurrentUser } from '@/features/auth/context/current-user.context'

type FormKind = 'contact' | 'booking' | 'collaboration' | null

function renderStars(r: number) {
  const n = Math.max(0, Math.min(5, Math.round(r)))
  return Array.from({ length: 5 }).map((_, i) => (
    <span key={i} className={i < n ? 'text-amber-500' : 'text-neutral-300'} aria-hidden>★</span>
  ))
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Artista</p>
      <h2 className="mt-1 text-xl font-black text-neutral-950">{children}</h2>
    </div>
  )
}

function TimelineCard({ icon, title, sub, description }: { icon: React.ReactNode; title: string; sub?: string | null; description?: string | null }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-neutral-950">{title}</h3>
          {sub && <p className="text-sm font-medium text-neutral-500">{sub}</p>}
          {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
        </div>
      </div>
    </div>
  )
}

interface Props { artist: ArtistProfileDetail }

export function ArtistProfile({ artist }: Props) {
  const [activeForm, setActiveForm] = useState<FormKind>(null)
  const currentUser = useOptionalCurrentUser()
  const initialName = currentUser?.displayName
  const initialEmail = currentUser?.email

  const portfolioItems = (artist.portfolio_items ?? []).filter((p) => p.status === 'PUBLISHED' || !p.status)
  const experiences = artist.experiences ?? []
  const achievements = artist.achievements ?? []
  const educations = artist.educations ?? []
  const reviews = (artist.reviews ?? []).filter(Boolean)

  return (
    <>
      <div className="min-h-screen bg-neutral-50/60 pb-16">
        <ArtistHeader artist={artist} />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

            {/* LEFT COLUMN */}
            <div className="space-y-10">

              {/* Biography */}
              {artist.biography && (
                <section>
                  <SectionTitle>Biografía</SectionTitle>
                  <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <p className="leading-relaxed text-neutral-600 whitespace-pre-wrap">{artist.biography}</p>
                  </div>
                </section>
              )}

              {/* Portfolio */}
              <section>
                <SectionTitle>Portafolio multimedia</SectionTitle>
                <p className="mb-5 -mt-2 text-sm text-neutral-500">Muestra de obra, presentaciones y colaboraciones destacadas.</p>
                <ArtistPortfolio items={portfolioItems} />
              </section>

              {/* Experience */}
              {experiences.length > 0 && (
                <section>
                  <SectionTitle>Experiencia</SectionTitle>
                  <div className="space-y-3">
                    {experiences.map((exp) => (
                      <TimelineCard key={exp.id} icon={<Calendar size={16} />}
                        title={exp.title} sub={exp.organization} description={exp.description} />
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <section>
                  <SectionTitle>Logros y reconocimientos</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {achievements.map((ach) => (
                      <TimelineCard key={ach.id}
                        icon={<Award size={16} className="!text-amber-500" />}
                        title={ach.title} sub={ach.issuer} description={ach.description} />
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {educations.length > 0 && (
                <section>
                  <SectionTitle>Formación</SectionTitle>
                  <div className="space-y-3">
                    {educations.map((edu) => (
                      <TimelineCard key={edu.id} icon={<BookOpen size={16} />}
                        title={edu.title} sub={edu.institution} description={edu.description} />
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <section>
                  <SectionTitle>Reseñas de la comunidad</SectionTitle>
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-1">
                          {renderStars(review.rating)}
                          {review.title && <span className="ml-2 text-sm font-semibold text-neutral-950">{review.title}</span>}
                        </div>
                        <p className="text-sm text-neutral-600">{review.comment}</p>
                        {review.profile?.username && (
                          <p className="mt-2 text-xs text-neutral-500">— {review.profile.username}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* RIGHT SIDEBAR */}
            <ArtistSidebar
              artist={artist}
              onContact={() => setActiveForm('contact')}
              onBooking={() => setActiveForm('booking')}
              onCollaboration={() => setActiveForm('collaboration')}
            />
          </div>
        </div>
      </div>

      {/* Form modals */}
      {activeForm === 'contact' && (
        <ContactFormModal artistId={artist.id} artistName={artist.stage_name} onClose={() => setActiveForm(null)} initialName={initialName} initialEmail={initialEmail} />
      )}
      {activeForm === 'booking' && (
        <BookingFormModal artistId={artist.id} artistName={artist.stage_name} onClose={() => setActiveForm(null)} initialName={initialName} initialEmail={initialEmail} />
      )}
      {activeForm === 'collaboration' && (
        <CollaborationFormModal artistId={artist.id} artistName={artist.stage_name} onClose={() => setActiveForm(null)} initialName={initialName} initialEmail={initialEmail} />
      )}
    </>
  )
}
