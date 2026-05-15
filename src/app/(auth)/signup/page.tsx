import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { RegisterForm } from '@/features/auth/components/register-form';
import BackgroundImage from '@/images/brand/Background-1.png';
import LogoWhite from '@/images/brand/Logo-Yebaam_white.svg';

export const metadata: Metadata = {
  title: 'Registrarse - Yebaam',
  description: 'Únete a Yebaam y conecta con amigos',
};

const Page = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image src={BackgroundImage} alt="Background" fill sizes="100vw" className="object-cover" priority />
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mx-auto mb-5 w-full max-w-60 text-center">
          <Image
            src={LogoWhite}
            alt="Yebaam Logo"
            width={240}
            height={60}
            className="h-auto w-full brightness-0 invert"
            style={{ height: 'auto' }}
            priority
          />
        </div>
        <div className="w-full rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
          <div className="mb-2 pt-4 pb-2">
            <h1 className="text-center text-2xl font-bold">Crea una cuenta</h1>
            <p className="text-center text-neutral-500">Es rápido y fácil.</p>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700" />
          <div className="mt-4 px-6 pb-6">
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
          <div className="mt-4 pb-4">
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-semibold text-green-600 transition-colors hover:text-amber-500">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
