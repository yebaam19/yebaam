'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { authService } from '@/features/auth/services/auth.service'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      // Wait for the SDK's pending PKCE exchange, then mirror the
      // access token into the httpOnly cookie before running checkAuth.
      const user = await authService.completeOAuthLogin()
      await checkAuth()
      if (cancelled) return
      const { isAuthenticated } = useAuthStore.getState()
      const redirect = searchParams.get('redirect') || '/feed'
      const authed = isAuthenticated || !!user
      router.replace((authed ? redirect : '/login') as never)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [checkAuth, router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-600">
        <svg className="h-8 w-8 animate-spin text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-sm">Completando inicio de sesión…</p>
      </div>
    </div>
  )
}
