'use client';

import { Field, Input, Label } from '@headlessui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import ButtonPrimary from '@/ui/ButtonPrimary';
import T from '@/utils/getT';
import { resetPasswordAction } from '@/features/auth/actions/password-recovery.actions';
import { resetPasswordSchema } from '@/features/auth/validators/auth.schemas';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsed = resetPasswordSchema.safeParse({ email, otp, newPassword, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordAction({
        email: parsed.data.email,
        otp: parsed.data.otp,
        newPassword: parsed.data.newPassword,
      });
      toast.success('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
      router.push('/login?reset=true');
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar la contraseña');
      toast.error(err?.message ?? 'No se pudo actualizar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">{T['login']['Email address']}</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ejemplo@ejemplo.com"
          required
          autoComplete="email"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </Field>

      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">Código de 6 dígitos</Label>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          required
          autoComplete="one-time-code"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg tracking-[0.5em] text-center text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </Field>

      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</Label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres, con mayúscula, minúscula y número"
          required
          autoComplete="new-password"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </Field>

      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">Confirmar contraseña</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          required
          autoComplete="new-password"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </Field>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <ButtonPrimary type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
      </ButtonPrimary>
    </form>
  );
}
