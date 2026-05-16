'use client'

import {
  AcademicCapIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  LanguageIcon,
  LightBulbIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import type { ProfessionalProfile } from '../../interfaces/professional-profile.interfaces'
import {
  composeStudyLine,
  composeTitleLine,
  getVerifiedDegrees,
} from '../../lib/credentials'
import { DegreeBadge } from '../profile/DegreeBadge'

interface Props {
  profile: ProfessionalProfile
  isOwner: boolean
}

function formatDateRange(start?: string | Date | null, end?: string | Date | null): string {
  const fmt = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : null
  const s = fmt(start)
  if (!s) return ''
  const e = fmt(end) ?? 'Presente'
  return `${s} – ${e}`
}

export function SummarySection({ profile, isOwner }: Props) {
  const t = useTranslations('professional')
  const titles = profile.titles ?? []
  const studies = profile.studies ?? []
  const experience = profile.experience ?? []
  const skills = profile.skills ?? []
  const licenses = profile.licenses ?? []
  const associations = profile.associations ?? []
  const languages = profile.languages ?? []

  const verifiedDegrees = getVerifiedDegrees(titles)

  // Sort verified-first, then by year desc.
  const topTitles = [...titles]
    .sort((a, b) => {
      const av = a.credentialStatus === 'approved' ? 1 : 0
      const bv = b.credentialStatus === 'approved' ? 1 : 0
      if (av !== bv) return bv - av
      return (b.year ?? 0) - (a.year ?? 0)
    })
    .slice(0, 3)
  const topStudies = [...studies]
    .sort((a, b) => {
      const av = a.credentialStatus === 'approved' ? 1 : 0
      const bv = b.credentialStatus === 'approved' ? 1 : 0
      if (av !== bv) return bv - av
      return (b.year ?? 0) - (a.year ?? 0)
    })
    .slice(0, 3)
  const recentExperience = experience.slice(0, 2)

  const focusesFromTitles = new Set<string>()
  for (const t of titles) for (const f of t.focuses ?? []) focusesFromTitles.add(f)
  const focuses = Array.from(focusesFromTitles)

  return (
    <div className="space-y-5">
      {verifiedDegrees.length > 0 && (
        <Block title="Credenciales verificadas" icon={CheckBadgeIcon}>
          <div className="flex flex-wrap gap-2">
            {verifiedDegrees.map((d) => (
              <DegreeBadge key={d} category={d} size="md" />
            ))}
          </div>
        </Block>
      )}

      <Block
        title={t('profile.sections.titles')}
        icon={AcademicCapIcon}
        emptyMsg={isOwner ? t('profile.empty.titles') : null}
        empty={topTitles.length === 0}
      >
        <ul className="space-y-1.5 text-sm">
          {topTitles.map((title) => (
            <li key={title.id} className="flex flex-wrap items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <span>{composeTitleLine(title)}</span>
              {title.credentialStatus === 'approved' && (
                <CheckBadgeIcon className="h-4 w-4 text-emerald-600" aria-label={t('sections.common.verified')} />
              )}
            </li>
          ))}
        </ul>
      </Block>

      <Block
        title={t('profile.sections.education')}
        icon={BookOpenIcon}
        emptyMsg={isOwner ? t('profile.empty.education') : null}
        empty={topStudies.length === 0}
      >
        <ul className="space-y-1.5 text-sm">
          {topStudies.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <span>{composeStudyLine(s)}</span>
              {s.credentialStatus === 'approved' && (
                <CheckBadgeIcon className="h-4 w-4 text-emerald-600" aria-label={t('sections.common.verified')} />
              )}
            </li>
          ))}
        </ul>
      </Block>

      <Block
        title={t('profile.sections.experience')}
        icon={BriefcaseIcon}
        emptyMsg={isOwner ? t('profile.empty.experience') : null}
        empty={recentExperience.length === 0}
      >
        <ul className="space-y-2 text-sm">
          {recentExperience.map((e) => (
            <li key={e.id}>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{e.position}</p>
              {(e.company || e.startDate) && (
                <p className="text-xs text-neutral-500">
                  {[e.company, formatDateRange(e.startDate, e.endDate)].filter(Boolean).join(' · ')}
                </p>
              )}
              {e.description && (
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">
                  {e.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Block>

      {(skills.length > 0 || focuses.length > 0) && (
        <Block title="Habilidades y enfoques" icon={LightBulbIcon}>
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
              >
                {s.name}
              </span>
            ))}
            {focuses.map((f) => (
              <span
                key={f}
                className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              >
                {f}
              </span>
            ))}
          </div>
        </Block>
      )}

      {languages.length > 0 && (
        <Block title="Idiomas" icon={LanguageIcon}>
          <div className="flex flex-wrap gap-1 text-sm text-neutral-700 dark:text-neutral-300">
            {languages.map((l) => (
              <span key={l.id}>
                {l.name}
                {l.proficiency ? ` (${l.proficiency})` : ''}
              </span>
            ))}
          </div>
        </Block>
      )}

      {licenses.length > 0 && (
        <Block title="Licencias" icon={DocumentTextIcon}>
          <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            {licenses.map((l) => (
              <li key={l.id}>
                {l.name}
                {l.issuedBy ? ` · ${l.issuedBy}` : ''}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {associations.length > 0 && (
        <Block title="Asociaciones" icon={UserGroupIcon}>
          <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            {associations.map((a) => (
              <li key={a.id}>
                {a.name}
                {a.role ? ` · ${a.role}` : ''}
              </li>
            ))}
          </ul>
        </Block>
      )}
    </div>
  )
}

function Block({
  title,
  icon: Icon,
  children,
  empty,
  emptyMsg,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  empty?: boolean
  emptyMsg?: string | null
}) {
  if (empty && !emptyMsg) return null
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <header className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        <Icon className="h-4 w-4" />
        {title}
      </header>
      {empty ? <p className="text-sm text-neutral-500">{emptyMsg}</p> : children}
    </section>
  )
}
