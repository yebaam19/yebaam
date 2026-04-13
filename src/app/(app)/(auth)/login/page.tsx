import { LoginForm } from '@/features/auth/components/login-form';
import BackgroundImage from '@/images/brand/Background-1.png';
import LogoWhite from '@/images/brand/Logo-Yebaam_white.svg';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Iniciar sesión - Yebaam',
  description: 'Inicia sesión en tu cuenta de Yebaam',
};

const Page = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <Image src={BackgroundImage} alt="Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden md:flex-row">
        <div className="flex w-full flex-col justify-center px-4 py-8 md:w-1/2 md:py-16">
          <div className="mb-4 text-center md:mb-6 md:text-left">
            <Image
              src={LogoWhite}
              alt="Yebaam Logo"
              width={450}
              height={115}
              className="mx-auto h-auto w-auto max-w-[300px] brightness-0 invert md:mx-0 md:max-w-[450px]"
              style={{ height: 'auto' }}
              priority
            />
          </div>
          <p className="mb-2 text-center text-xl font-semibold text-white md:text-left md:text-2xl">
            Comparte experiencias de otro mundo y mantén vínculos duraderos con las personas que realmente importan.
          </p>
        </div>
        <div className="flex w-full flex-col items-center justify-center p-8 md:w-1/2">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-neutral-900">
            <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-white">Iniciar sesión</h2>

            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
                </div>
              }
            >
              <LoginForm showForgotPassword={true} showDevHelper={true} />
            </Suspense>

            {/* Create account */}
            <div className="mt-6 border-t border-neutral-200 pt-4 text-center dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                ¿No tienes una cuenta?{' '}
                <Link href="/signup" className="font-semibold text-green-600 transition-colors hover:text-amber-500">
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
          {/* Create Page Link */}
          <p className="mt-6 text-center text-sm text-white">
            <Link href="/feed/paginas" className="font-semibold hover:underline">
              Crea una página
            </Link>{' '}
            para una celebridad, una marca o un negocio.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Page;
