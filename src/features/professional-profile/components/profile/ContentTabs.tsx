/**
 * ContentTabs Component
 *
 * Tabs para navegar entre las diferentes secciones del perfil profesional
 * Usa los componentes compartidos de @/ui/tabs
 */

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import {
  AcademicCapIcon,
  BookOpenIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  LanguageIcon,
  LightBulbIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

// Sections
import {
  AssociationsSection,
  ExperienceSection,
  LanguagesSection,
  LicensesSection,
  SectionSkeleton,
  SkillsSection,
  StudiesSection,
  SummarySection,
  TitlesSection,
} from '../sections'
import type { ProfessionalProfile } from '../../interfaces/professional-profile.interfaces'

interface ContentTabsProps {
  profile: ProfessionalProfile
  isOwner: boolean
  isRefetching?: boolean
}

export function ContentTabs({ profile, isOwner, isRefetching = false }: ContentTabsProps) {
  const t = useTranslations('professional')

  const tabs = [
    { key: 'summary', name: t('profile.tabs.summary'), icon: Squares2X2Icon },
    { key: 'titles', name: t('profile.tabs.titles'), icon: AcademicCapIcon },
    { key: 'education', name: t('profile.tabs.education'), icon: BookOpenIcon },
    { key: 'experience', name: t('profile.tabs.experience'), icon: BriefcaseIcon },
    { key: 'skills', name: t('profile.tabs.skills'), icon: LightBulbIcon },
    { key: 'languages', name: t('profile.tabs.languages'), icon: LanguageIcon },
    { key: 'licenses', name: t('profile.tabs.licenses'), icon: DocumentTextIcon },
    { key: 'memberships', name: t('profile.tabs.memberships'), icon: UserGroupIcon },
  ]

  // Si está refetching (re-cargando datos), mostrar skeleton
  if (isRefetching && !profile) {
    return <SectionSkeleton />
  }

  return (
    <Tabs>
      <div className="no-scrollbar overflow-x-auto">
        <TabsList className="min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.key}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>

      <TabsContent>
        <SummarySection profile={profile} isOwner={isOwner} />
      </TabsContent>

      <TabsContent>
        <TitlesSection profileId={profile.id} isOwner={isOwner} items={profile.titles} />
      </TabsContent>

      <TabsContent>
        <StudiesSection profileId={profile.id} isOwner={isOwner} items={profile.studies} />
      </TabsContent>
      
      <TabsContent>
        <ExperienceSection profileId={profile.id} isOwner={isOwner} items={profile.experience} />
      </TabsContent>
      
      <TabsContent>
        <SkillsSection profileId={profile.id} isOwner={isOwner} items={profile.skills} />
      </TabsContent>
      
      <TabsContent>
        <LanguagesSection profileId={profile.id} isOwner={isOwner} items={profile.languages} />
      </TabsContent>
      
      <TabsContent>
        <LicensesSection profileId={profile.id} isOwner={isOwner} items={profile.licenses} />
      </TabsContent>
      
      <TabsContent>
        <AssociationsSection profileId={profile.id} isOwner={isOwner} items={profile.associations} />
      </TabsContent>
    </Tabs>
  )
}
