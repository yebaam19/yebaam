'use client';

import { Field, Input, Label } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import ButtonPrimary from '@/ui/ButtonPrimary';
import T from '@/utils/getT';
import { requestPasswordResetAction } from '@/features/auth/actions/password-recovery.actions';
import { forgotPasswordSchema } from '@/features/auth/validators/auth.schemas';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email inválido');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordResetAction({ email: parsed.data.email });
      toast.success(result.message);
      router.push(`/reset-password?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo enviar el código');
      toast.error(err?.message ?? 'No se pudo enviar el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <ButtonPrimary type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Enviando...' : T['common']['Continue']}
      </ButtonPrimary>
    </form>
  );
}
