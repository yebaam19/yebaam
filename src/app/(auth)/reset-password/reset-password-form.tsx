'use client';

import { Field, Input, Label } from '@headlessui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import ButtonPrimary from '@/ui/ButtonPrimary';
import { resetPasswordAction } from '@/features/auth/actions/password-recovery.actions';
import { resetPasswordSchema } from '@/features/auth/validators/auth.schemas';

export function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations('auth');
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
      // TODO: i18n — validator messages defined at module load time
      setError(parsed.error.issues[0]?.message ?? t('passwordReset.resetInvalidData'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPasswordAction({
        email: parsed.data.email,
        otp: parsed.data.otp,
        newPassword: parsed.data.newPassword,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(t('passwordReset.resetSuccessToast'));
      router.push('/login?reset=true');
    } catch (err: any) {
      const msg = err?.message ?? t('passwordReset.resetUpdateError');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">{t('passwordReset.emailLabel')}</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('passwordReset.emailPlaceholder')}
          required
          autoComplete="email"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </Field>

      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">{t('passwordReset.otpLabel')}</Label>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={t('passwordReset.otpPlaceholder')}
          required
          autoComplete="one-time-code"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg tracking-[0.5em] text-center text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </Field>

      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">{t('passwordReset.newPasswordLabel')}</Label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('passwordReset.newPasswordPlaceholder')}
          required
          autoComplete="new-password"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </Field>

      <Field className="block">
        <Label className="block text-sm font-medium text-gray-700 mb-2">{t('passwordReset.confirmPasswordLabel')}</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('passwordReset.confirmPasswordPlaceholder')}
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
        {isSubmitting ? t('passwordReset.resetSubmitting') : t('passwordReset.resetSubmit')}
      </ButtonPrimary>
    </form>
  );
}
