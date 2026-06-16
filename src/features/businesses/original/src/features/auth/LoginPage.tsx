import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginForm, { type LoginFormValues } from './components/LoginForm'
import { login } from './api'
import { trackEvent } from '../../lib/analytics'
import { getErrorMessage } from '../../lib/httpError'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(values: LoginFormValues) {
    setLoading(true)
    setError('')

    try {
      const result = await login(values.email, values.password)

      const token = result?.token
      const user = result?.user

      if (!token) {
        throw new Error('No se recibió token de acceso')
      }

      localStorage.setItem('auth_token', token)

      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user))
      }

      void trackEvent({
        eventType: 'LOGIN_SUCCESS',
        sourceScreen: 'login',
        metadata: { role: user?.role ?? null },
      })

      const nextPath =
        user?.role === 'ADMIN' || user?.role === 'BUSINESS_ADMIN'
          ? '/admin'
          : '/businesses'

      navigate(nextPath)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos iniciar sesión'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
        <div className="max-w-xl">
          <Link
            to="/"
            className="mb-5 inline-flex text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            ← Volver al inicio
          </Link>

          <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Acceso
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Entra y retoma tu recorrido.
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
            Vuelve a tus negocios, reseñas y herramientas de administración sin empezar
            desde cero.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Recorrido sin cortes
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Retoma lo que estabas viendo y avanza más rápido.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Panel disponible
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Si administras un negocio, entra directo a tus herramientas.
              </p>
            </div>
          </div>
        </div>

        <div>
          <LoginForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            description="Ingresa tus credenciales y continúa donde quedaste."
          />
        </div>
      </section>
    </main>
  )
}
