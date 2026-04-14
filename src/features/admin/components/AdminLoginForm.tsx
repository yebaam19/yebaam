'use client'

import { useState, useTransition } from 'react'
import { adminLogin } from '@/features/admin/actions/auth.actions'

interface Props {
  initialError?: string | null
}

export default function AdminLoginForm({ initialError }: Props) {
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await adminLogin(formData)
      if (result && !result.ok) {
        setError(result.error ?? 'No se pudo iniciar sesión.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          disabled={isPending}
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Contraseña
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Verificando…' : 'Entrar al panel'}
      </button>

      <p className="text-center text-xs text-neutral-500">
        Acceso restringido. Las credenciales se crean manualmente desde Supabase.
      </p>
    </form>
  )
}
