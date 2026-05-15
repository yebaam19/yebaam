import VerifyEmailForm from '@/features/auth/components/VerifyEmailForm';
import BackgroundImage from '@/images/brand/Background-1.png';
import LogoWhite from '@/images/brand/Logo-Yebaam_white.svg';
import { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Verificar Email - Yebaam',
  description: 'Verifica tu correo electrónico para activar tu cuenta',
};

export default function VerifyEmailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image src={BackgroundImage} alt="Background" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mx-auto mb-5 w-full max-w-60 text-center">
          <Image
            src={LogoWhite}
            alt="Yebaam Logo"
            width={583}
            height={170}
            className="h-auto w-full brightness-0 invert"
            priority
          />
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-neutral-900">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              </div>
            }
          >
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
