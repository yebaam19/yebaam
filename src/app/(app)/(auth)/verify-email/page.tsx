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
      <div className="absolute inset-0 z-0">
        <Image src={BackgroundImage} alt="Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-5 text-center">
          <Image
            src={LogoWhite}
            alt="Yebaam Logo"
            width={240}
            height={60}
            className="mx-auto h-auto w-auto max-w-60 brightness-0 invert"
            style={{ height: 'auto' }}
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
