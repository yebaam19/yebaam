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

const tabs = [
  { name: 'Resumen', icon: Squares2X2Icon, component: SummarySection },
  { name: 'Titulos', icon: AcademicCapIcon, component: TitlesSection },
  { name: 'Estudios', icon: BookOpenIcon, component: StudiesSection },
  { name: 'Experiencia', icon: BriefcaseIcon, component: ExperienceSection },
  { name: 'Habilidades', icon: LightBulbIcon, component: SkillsSection },
  { name: 'Idiomas', icon: LanguageIcon, component: LanguagesSection },
  { name: 'Licencias', icon: DocumentTextIcon, component: LicensesSection },
  { name: 'Asociaciones', icon: UserGroupIcon, component: AssociationsSection },
]

export function ContentTabs({ profile, isOwner, isRefetching = false }: ContentTabsProps) {
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
              <TabsTrigger key={tab.name}>
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
