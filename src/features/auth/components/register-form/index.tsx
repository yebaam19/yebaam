'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../store/auth.store';
import { toast } from 'sonner';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget';
import { validatePasswordPolicy } from '@/lib/auth/password-policy';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import { NameFields } from './NameFields';
import { BirthDateFields } from './BirthDateFields';
import { GenderField } from './GenderField';
import { LocationFields } from './LocationFields';
import { OccupationField } from './OccupationField';
import { CredentialsFields } from './CredentialsFields';
import { isOccupationSlug, type OccupationSlug } from '../../constants/occupations';

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  // Where to land after the whole signup → verify → login chain (e.g. a
  // shared /umbral link). Threaded through /verify-email into /login, which
  // already honors ?redirect after sign-in.
  const redirectParam = searchParams.get('redirect');
  const { register, isLoading, error } = useAuthStore();

  // Estado del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    secondName: '',
    lastName: '',
    secondLastName: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    country: 'CO',
    state: '',
    city: '',
    occupation: '',
    acceptedTerms: false,
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.acceptedTerms) {
      toast.error(t('signup.errorMustAcceptTerms'));
      return;
    }

    if (!isOccupationSlug(formData.occupation)) {
      toast.error(t('signup.errorSelectOccupation'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('signup.errorPasswordsDoNotMatch'));
      return;
    }

    const passwordError = validatePasswordPolicy(formData.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (turnstileEnabled && !captchaToken) {
      toast.error(t('errors.turnstileRequired'));
      return;
    }

    try {
      // Formatear fecha de nacimiento en formato YYYY-MM-DD
      const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;

      // Convertir género al formato esperado por el backend
      const genderMap: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
        'female': 'FEMALE',
        'male': 'MALE',
        'other': 'OTHER'
      };

      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate,
        gender: genderMap[formData.gender] || 'OTHER',
        country: formData.country,
        state: formData.state,
        city: formData.city,
        occupation: formData.occupation as OccupationSlug,
        acceptedTerms: formData.acceptedTerms,
        secondName: formData.secondName || undefined,
        secondLastName: formData.secondLastName || undefined,
        captchaToken: captchaToken ?? undefined,
      };

      const response = await register(payload);

      // pendingVerification: el email ya tenía un registro sin confirmar y se
      // reemitió el código — el mensaje del servidor explica esa situación.
      toast.success(response?.pendingVerification ? response.message : t('signup.successToast'));
      const verifyParams = new URLSearchParams({ email: formData.email });
      if (redirectParam) verifyParams.set('redirect', sanitizeRedirectPath(redirectParam));
      router.push(`/verify-email?${verifyParams.toString()}`);
    } catch (err) {
      console.error('[RegisterForm] Error en registro:', err);
      toast.error((err instanceof Error && err.message) || t('signup.genericError'));
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombres y Apellidos */}
      <NameFields
        firstName={formData.firstName}
        lastName={formData.lastName}
        onChange={handleChange}
      />

      {/* Fecha de nacimiento */}
      <BirthDateFields
        birthDay={formData.birthDay}
        birthMonth={formData.birthMonth}
        birthYear={formData.birthYear}
        onChange={handleChange}
      />

      {/* Género */}
      <GenderField
        gender={formData.gender}
        onChange={handleChange}
      />

      {/* Ocupación */}
      <OccupationField
        occupation={formData.occupation}
        onChange={handleChange}
      />

      <CredentialsFields
        email={formData.email}
        password={formData.password}
        confirmPassword={formData.confirmPassword}
        onChange={handleChange}
      />

      {/* Ubicación */}
      <LocationFields
        country={formData.country}
        state={formData.state}
        city={formData.city}
        onChange={handleChange}
      />

      {/* Términos y condiciones */}
      <div className="pt-2">
        <label className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
            required
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>
            {t('signup.acceptTermsBefore')}{' '}
            <a href="/normativa/terminos" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{t('signup.acceptTermsLink')}</a>
            {' '}{t('signup.acceptTermsMiddle')}{' '}
            <a href="/normativa/terminos#parte-vi-politica-de-privacidad-extendida" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{t('signup.acceptPrivacyLink')}</a>
          </span>
        </label>
        <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
          {t('signup.afterSignupInfo')}
        </p>
      </div>

      {/* Cloudflare Turnstile — verifies the request before signupWithOtpAction runs */}
      <TurnstileWidget
        ref={turnstileRef}
        action="signup"
        onSuccess={setCaptchaToken}
        onExpire={() => setCaptchaToken(null)}
        onError={() => setCaptchaToken(null)}
      />

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold text-base rounded-lg transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('signup.submitting')}
          </span>
        ) : (
          t('signup.submit')
        )}
      </button>
    </form>
  );
}
