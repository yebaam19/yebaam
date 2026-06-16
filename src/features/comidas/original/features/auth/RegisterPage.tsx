import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RegisterForm, { type RegisterFormValues } from './components/RegisterForm'
import { register } from './api'
import { trackEvent } from '../../lib/analytics'
import { getErrorMessage } from '../../lib/httpError'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(values: RegisterFormValues) {
    setLoading(true)
    setError('')

    try {
      const result = await register(
        values.fullName,
        values.email,
        values.password
      )

      const token = result?.token
      const user = result?.user
      const hasAdminAccess =
        user?.role === 'ADMIN' || user?.role === 'BUSINESS_ADMIN'

      if (token) {
        localStorage.setItem('auth_token', token)
      }

      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user))
      }

      void trackEvent({
        eventType: 'REGISTER_SUCCESS',
        sourceScreen: 'register',
        metadata: { role: user?.role ?? null },
      })

      navigate(hasAdminAccess ? '/admin' : '/businesses')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos crear la cuenta'))
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
            Registro
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Crea tu cuenta y descubre dónde pedir con más confianza.
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
            Usa Yebaam para explorar negocios, escribir reseñas y acceder a tu panel
            si administras una vitrina gastronómica.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Exploración más simple
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Mantén tu sesión y vuelve a lo que estabas revisando.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Participación real
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Comparte reseñas y señales útiles para otros usuarios.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Vitrina para negocios
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Si administras un negocio, tu cuenta puede abrir el panel de operación.
              </p>
            </div>
          </div>
        </div>

        <div>
          <RegisterForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            title="Crear cuenta"
            description="Completa tus datos y empieza a usar Yebaam."
          />
        </div>
      </section>
    </main>
  )
}
