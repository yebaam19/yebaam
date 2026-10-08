'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { CommunityAbout, AboutMedia } from '../../types/communityAbout.types';
import type { CommunitySection, ProfileCapabilities, PlanPage } from '../../types/communityPlan.types';
import { PlanInteractionProvider, usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanSectionSettings } from '../plans/PlanSectionSettings';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { AboutForm } from './AboutForm';
import { AboutReadView } from './AboutReadView';
import { AboutMediaGallery } from './AboutMediaGallery';

type Props = {
  communityId: string; name: string; section?: CommunitySection; about: CommunityAbout | null;
  media: PlanPage<AboutMedia>; capabilities: ProfileCapabilities;
};
export function AboutWorkspace(props: Props) {
  return <PlanInteractionProvider><Workspace {...props} /></PlanInteractionProvider>;
}
function Workspace({ communityId, name, section, about, media, capabilities }: Props) {
  const t = useTranslations('communities.about');
  const interaction = usePlanInteraction();
  const editorId = `about:${section?.id}`;
  const opener = useEditorReturnFocus(editorId);
  return <section className="min-w-0 rounded-xl bg-white p-4 text-neutral-900 sm:p-6 dark:bg-neutral-800 dark:text-white">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h2 className="min-w-0 flex-1 basis-full text-xl font-semibold wrap-anywhere sm:basis-auto">{section?.title ?? t('title')}</h2>
      {section && capabilities.content && <Button ref={opener} color="brand" disabled={interaction.busy || !!interaction.editor}
        onClick={() => interaction.beginEdit(editorId)}>{t(about ? 'edit' : 'create')}</Button>}
    </div>
    {capabilities.settings && <PlanSectionSettings communityId={communityId} kind="about" section={section} />}
    {!section && <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">{t('setupHint')}</p>}
    {section && interaction.editor === editorId ? <AboutForm communityId={communityId} sectionId={section.id}
      about={about} name={name} editorId={editorId} onClose={interaction.endEdit} /> : section && <div className="mt-6">
      {about ? <>
        {!about.is_published && <p className="mb-4 text-sm text-secondary-900 dark:text-secondary-300">{t('draftHint')}</p>}
        <AboutReadView about={about} name={name} />
      </> : <p className="text-sm text-neutral-600 dark:text-neutral-300">{t(capabilities.content ? 'emptyEditor' : 'emptyReader')}</p>}
    </div>}
    {about && <AboutMediaGallery communityId={communityId} aboutId={about.id} initial={media} canEdit={capabilities.content} />}
  </section>;
}
