'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget'
import { useAuthStore } from '../store/auth.store'
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect'
import { isEmailNotConfirmedError } from '../utils/auth-errors'

interface LoginFormProps {
  showForgotPassword?: boolean
}

export function LoginForm({ showForgotPassword = true }: LoginFormProps) {
  const router = useRouter()
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const { login, isLoading, error } = useAuthStore()

  // Pre-fill email if coming from verification
  const emailFromUrl = searchParams.get('email') || ''
  const verified = searchParams.get('verified') === 'true'
  const reset = searchParams.get('reset') === 'true'
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirect'))

  const [identifier, setIdentifier] = useState(emailFromUrl)
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null)

  useEffect(() => {
    if (verified && emailFromUrl) {
      toast.success(t('login.emailVerifiedToast'))
    }
  }, [verified, emailFromUrl, t])

  useEffect(() => {
    if (reset) {
      toast.success(t('login.resetSuccessToast'))
    }
  }, [reset, t])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const blocked = sessionStorage.getItem('auth:blocked')
    if (blocked) {
      toast.error(blocked)
      sessionStorage.removeItem('auth:blocked')
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    if (turnstileEnabled && !captchaToken) {
      toast.error(t('errors.turnstileRequired'))
      return
    }

    try {
      await login({
        email: identifier,
        password,
        captchaToken: captchaToken ?? undefined,
      })

      toast.success(t('login.welcomeBack'))
      router.push(redirectTo)
    } catch (err: unknown) {
      // Half-registered account: the email was never confirmed. Instead of a
      // dead-end error, route the user back into the verification flow where
      // they can resend a fresh code and finish signing up.
      if (isEmailNotConfirmedError(err)) {
        toast.info(t('login.needsVerificationToast'))
        router.push(`/verify-email?email=${encodeURIComponent(identifier)}`)
        return
      }
      const message = err instanceof Error ? err.message : ''
      toast.error(message || t('login.genericError'))
      // Turnstile tokens are single-use — refresh the widget so the user can retry.
      setCaptchaToken(null)
      turnstileRef.current?.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-gray-700">
          {t('login.emailLabel')}
        </label>
        <input
          type="email"
          id="identifier"
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t('login.emailPlaceholder')}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
          {t('login.passwordLabel')}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('login.passwordPlaceholder')}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>

      {/* Error Message */}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Cloudflare Turnstile — verifies the request before hitting Supabase auth */}
      <TurnstileWidget
        ref={turnstileRef}
        action="login"
        onSuccess={setCaptchaToken}
        onExpire={() => setCaptchaToken(null)}
        onError={() => setCaptchaToken(null)}
      />

      {/* Forgot password */}
      {showForgotPassword && (
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-green-600 transition-colors hover:text-amber-500"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-white shadow-md transition-colors hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {t('login.submitting')}
          </span>
        ) : (
          t('login.submit')
        )}
      </button>

    </form>
  )
}
