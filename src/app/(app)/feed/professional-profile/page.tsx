import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ProfessionalBenefits } from '@/features/professional-profile/components/welcome/ProfessionalBenefits';
import { ValidationSteps } from '@/features/professional-profile/components/welcome/ValidationSteps';
import { WelcomeCTA } from './WelcomeCTA';
import { getMyProfile } from './server/profile.server';

export default async function ProfessionalProfileWelcomePage() {
  const profile = await getMyProfile();
  if (profile) {
    const identifier = profile.user?.username || profile.userId;
    redirect(`/feed/professional-profile/${identifier}`);
  }

  const t = await getTranslations('professional');

  return (
    <div className="min-h-screen min-w-0 bg-neutral-50 dark:bg-neutral-900">
      <div className="mx-auto max-w-6xl min-w-0 px-4 py-5 sm:px-5">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl lg:text-5xl dark:text-white">
            {t('welcome.title')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            {t('welcome.subtitle')}
          </p>
        </div>

        <section className="mb-12 px-0 py-3 sm:p-5">
          <ProfessionalBenefits />
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900 dark:text-white">
            {t('welcome.howValidationWorks')}
          </h2>
          <ValidationSteps />
        </section>

        <WelcomeCTA />
      </div>
    </div>
  );
}
