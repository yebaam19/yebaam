import LogoWhite from '@/images/brand/Logo-Yebaam_white.svg';
import Image from 'next/image';
import T from '@/utils/getT';
import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña - Yebaam',
  description: 'Crea una nueva contraseña para tu cuenta',
};

const Page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#087632' }}>
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src={LogoWhite}
              alt="Yebaam Logo"
              width={300}
              height={60}
              style={{ height: 56, width: 'auto' }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Restablecer contraseña
          </h1>
          <p className="text-white/80">
            Ingresa el código que enviamos a tu correo y elige una nueva contraseña.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-white">
          <Link href="/forgot-password" className="font-semibold underline hover:text-white/80 transition-colors">
            Reenviar código
          </Link>
          {`  o  `}
          <Link href="/login" className="font-semibold underline hover:text-white/80 transition-colors">
            {T['login']['Sign in']}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
