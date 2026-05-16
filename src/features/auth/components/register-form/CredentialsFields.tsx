'use client'

import { useTranslations } from 'next-intl'

interface CredentialsFieldsProps {
  email: string
  password: string
  confirmPassword: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function CredentialsFields({ email, password, confirmPassword, onChange }: CredentialsFieldsProps) {
  const t = useTranslations('auth')
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-medium text-gray-600">
          {t('signup.emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={email}
          onChange={onChange}
          placeholder={t('signup.emailPlaceholder')}
          required
          autoComplete="email"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-xs font-medium text-gray-600">
          {t('signup.passwordLabel')}
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={password}
          onChange={onChange}
          placeholder={t('signup.passwordPlaceholder')}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-xs font-medium text-gray-600">
          {t('signup.confirmPasswordLabel')}
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={onChange}
          placeholder={t('signup.confirmPasswordPlaceholder')}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>
    </div>
  )
}
