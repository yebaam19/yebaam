import ButtonPrimary from '@/ui/ButtonPrimary';
import LogoWhite from '@/images/brand/Logo-Yebaam_white.svg';
import Image from 'next/image';
import T from '@/utils/getT';
import { Field, Label, Input } from '@headlessui/react';
import { Metadata } from 'next';
import Link from 'next/link';

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
          <div className="mx-auto mb-6 h-14 w-auto">
            <Image
              src={LogoWhite}
              alt="Yebaam Logo"
              width={300}
              height={60}
              className="h-full w-auto"
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
          {/* FORM */}
          <form className="space-y-6" action="#" method="post">
            <Field className="block">
              <Label className="block text-sm font-medium text-gray-700 mb-2">{T['login']['Email address']}</Label>
              <Input
                type="email"
                placeholder="ejemplo@ejemplo.com"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </Field>

            <ButtonPrimary type="submit" className="w-full">{T['common']['Continue']}</ButtonPrimary>
          </form>
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
