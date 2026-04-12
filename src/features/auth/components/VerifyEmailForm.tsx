'use client'

import { authService } from '@/features/auth/services/auth.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { VerifyEmailFormData, verifyEmailSchema } from '../validators/auth.schemas'

/**
 * STEP 2: Verificar Email con código OTP
 */
export default function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { resendOtp, isLoading: isResending } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailFromUrl,
    },
  })

  const onSubmit = async (data: VerifyEmailFormData) => {
    setIsSubmitting(true)

    try {
      const response = await authService.verifyEmail(data)
      toast.success('¡Email verificado exitosamente! Ya puedes iniciar sesión')

      // Redirigir a login para que el usuario inicie sesión
      router.push(`/login?email=${encodeURIComponent(data.email)}&verified=true`)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Código inválido o expirado'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    try {
      await resendOtp({ email: emailFromUrl })
      toast.success('Código reenviado exitosamente')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al reenviar el código'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Verifica tu email</h2>
        <p className="mb-1 text-base text-gray-600">Hemos enviado un código de 6 dígitos a</p>
        <p className="text-base font-semibold text-gray-900">{emailFromUrl}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email (readonly/hidden) */}
        <input type="hidden" {...register('email')} />

        {/* OTP Code */}
        <div>
          <label htmlFor="otp" className="mb-3 block text-center text-sm font-medium text-gray-700">
            Ingresa el código de verificación
          </label>
          <input
            type="text"
            id="otp"
            placeholder="000000"
            maxLength={6}
            {...register('otp')}
            disabled={isSubmitting}
            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-5 text-center text-4xl font-bold tracking-[0.5em] text-gray-900 tabular-nums transition-all placeholder:text-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          {errors.otp && <p className="mt-3 text-center text-sm font-medium text-red-600">{errors.otp.message}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-yellow-500 px-4 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verificando...
            </span>
          ) : (
            'Verificar código'
          )}
        </button>

        {/* Resend Code */}
        <div className="space-y-3 pt-2">
          {/* Información sobre expiración */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              El código expira en <span className="font-semibold text-gray-900">10 minutos</span>
            </p>
          </div>

          {/* Botón de reenvío */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm font-medium text-green-600 transition-colors hover:text-green-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Reenviando código...
                </span>
              ) : (
                '¿No recibiste el código o expiró? Volver a enviar'
              )}
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            Paso 2 de 3: Verifica tu email para continuar
          </p>
        </div>
      </form>
    </div>
  )
}
