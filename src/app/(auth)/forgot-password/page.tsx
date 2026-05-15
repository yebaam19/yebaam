import LogoWhite from '@/images/brand/Logo-Yebaam_white.svg';
import Image from 'next/image';
import T from '@/utils/getT';
import { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña - Yebaam',
  description: 'Restablece tu contraseña',
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
              width={583}
              height={170}
              style={{ height: 56, width: 'auto' }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-white/80">
            Ingresa tu email para restablecer tu contraseña
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ForgotPasswordForm />
        </div>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-white">
          {T['login']['New user?']} {` `}
          <Link href="/signup" className="font-semibold underline hover:text-white/80 transition-colors">
            {T['login']['Create an account']}
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
