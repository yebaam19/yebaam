import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { RegisterForm } from '@/features/auth/components/register-form';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import BackgroundImage from '@/images/brand/Background-1.png';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return {
    title: t('signup.metaTitle'),
    description: t('signup.metaDescription'),
  };
}

const Page = async ({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) => {
  const t = await getTranslations('auth');
  // Mirror of the login page: keep a pending post-auth destination alive
  // when the visitor crosses to the login page instead of registering.
  const { redirect } = await searchParams;
  const redirectParam = redirect ? sanitizeRedirectPath(redirect) : null;

  return (
    <main className="relative flex min-h-screen w-full flex-col">
      <div className="absolute inset-0 z-0">
        <Image src={BackgroundImage} alt="Background" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4 py-6 sm:px-6 md:px-12 md:py-10 lg:px-20 xl:px-28">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
          <div className="px-4 pt-5 pb-3 sm:px-6">
            <h1 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">{t('signup.title')}</h1>
            <p className="mt-1 text-center text-sm text-neutral-500">{t('signup.subtitle')}</p>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700" />
          <div className="px-4 pt-4 pb-5 sm:px-6 sm:pb-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
                </div>
              }
            >
              <RegisterForm />
            </Suspense>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700" />
          <div className="px-4 py-4 sm:px-6">
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              {t('signup.haveAccount')}{' '}
              <Link
                href={redirectParam ? { pathname: '/login', query: { redirect: redirectParam } } : '/login'}
                className="font-semibold text-green-600 transition-colors hover:text-amber-500"
              >
                {t('signup.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
