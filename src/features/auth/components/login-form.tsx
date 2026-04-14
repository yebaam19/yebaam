'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/auth.store'

interface LoginFormProps {
  showForgotPassword?: boolean
  showDevHelper?: boolean
}

export function LoginForm({ showForgotPassword = true, showDevHelper = true }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loginWithGoogle, isLoading, error } = useAuthStore()

  // Pre-fill email if coming from verification
  const emailFromUrl = searchParams.get('email') || ''
  const verified = searchParams.get('verified') === 'true'
  const redirectTo = searchParams.get('redirect') || '/feed'

  const [identifier, setIdentifier] = useState(emailFromUrl)
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (verified && emailFromUrl) {
      toast.success('Email verificado correctamente! Ya puedes iniciar sesión')
    }
  }, [verified, emailFromUrl])

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

    try {
      await login({
        email: identifier,
        password,
      })

      toast.success('¡Bienvenido de nuevo!')
      router.push(redirectTo as unknown as Parameters<typeof router.push>[0])
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión')
    }
  }

  const handleSelectTestUser = (email: string, pass: string) => {
    setIdentifier(email)
    setPassword(pass)
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(`${window.location.origin}${redirectTo}`)
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión con Google')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="identifier"
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="correo@ejemplo.com"
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>

      {/* Error Message */}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

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
            Iniciando sesión...
          </span>
        ) : (
          'Ingresar'
        )}
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-500">o</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continuar con Google
      </button>
    </form>
  )
}
