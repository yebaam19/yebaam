import { LoginForm } from '@/features/auth/components/login-form';
import BackgroundImage from '@/images/brand/Background-1.png';
import LogoWhite from '@/images/brand/Logo-Yebaam_white.png';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return {
    title: t('login.metaTitle'),
    description: t('login.metaDescription'),
  };
}

const Page = async () => {
  const t = await getTranslations('auth');

  return (
    <main className="relative flex min-h-screen w-full flex-col md:flex-row">
      <div className="absolute inset-0 z-0">
        <Image src={BackgroundImage} alt="Background" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        <div className="flex w-full flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-20 xl:px-28">
          <div className="mx-auto w-full max-w-xl md:mx-0">
            <div className="mb-6 w-full max-w-75 text-center md:mb-8 md:max-w-112.5 md:text-left">
              <Image
                src={LogoWhite}
                alt="Yebaam Logo"
                width={583}
                height={170}
                className="h-auto w-full brightness-0 invert"
                priority
              />
            </div>
            <p className="text-center text-xl font-semibold text-white md:text-left md:text-2xl lg:text-3xl">
              {t('login.tagline')}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-10 md:px-12 lg:px-20 xl:px-28">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-neutral-900">
            <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-white">{t('login.title')}</h2>

            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
                </div>
              }
            >
              <LoginForm showForgotPassword={true} />
            </Suspense>

            {/* Create account */}
            <div className="mt-6 border-t border-neutral-200 pt-4 text-center dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('login.noAccount')}{' '}
                <Link href="/signup" className="font-semibold text-green-600 transition-colors hover:text-amber-500">
                  {t('login.signupLink')}
                </Link>
              </p>
            </div>
          </div>
          {/* Create Page Link */}
          <p className="mt-6 text-center text-sm text-white">
            <Link href="/paginas" className="font-semibold hover:underline">
              {t('login.createPageLink')}
            </Link>{' '}
            {t('login.createPageAfter')}
          </p>
        </div>
      </div>
    </main>
  );
};

export default Page;
