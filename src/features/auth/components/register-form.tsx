'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/auth.store'
import { BirthDateFields } from './register-form/BirthDateFields'
import { GenderField } from './register-form/GenderField'
import { LocationFields } from './register-form/LocationFields'
import { NameFields } from './register-form/NameFields'

export function RegisterForm() {
  const router = useRouter()
  const { register, isLoading, error } = useAuthStore()

  // Estado del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    country: '',
    state: '',
    city: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      // Formatear fecha de nacimiento en formato YYYY-MM-DD
      const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`

      // Convertir género al formato esperado por el backend
      const genderMap: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
        female: 'FEMALE',
        male: 'MALE',
        other: 'OTHER',
      }

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
        acceptedTerms: true,
      }

      await register(payload)

      toast.success('Registro exitoso! Verifica tu email')
      // Redirigir a verificar email
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      console.error('[RegisterForm] Error en registro:', err)
      toast.error(err.message || 'Error al registrar usuario')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombres y Apellidos - Componente modular */}
      <NameFields firstName={formData.firstName} lastName={formData.lastName} onChange={handleChange} />

      {/* Fecha de nacimiento - Componente modular */}
      <BirthDateFields
        birthDay={formData.birthDay}
        birthMonth={formData.birthMonth}
        birthYear={formData.birthYear}
        onChange={handleChange}
      />

      {/* Género - Componente modular */}
      <GenderField gender={formData.gender} onChange={handleChange} />

      {/* Correo electrónico */}
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Correo electrónico"
        required
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
      />

      {/* Contraseña */}
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Contraseña nueva (mínimo 8 caracteres)"
        required
        minLength={8}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
      />

      {/* Ubicación - Componente modular */}
      <LocationFields country={formData.country} state={formData.state} city={formData.city} onChange={handleChange} />

      {/* Términos y condiciones */}
      <div className="pt-2">
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-gray-600">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>
            Acepto los{' '}
            <a href="/terms" className="text-green-600 hover:underline">
              Términos y Condiciones
            </a>{' '}
            y la{' '}
            <a href="/privacy" className="text-green-600 hover:underline">
              Política de Datos
            </a>
          </span>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-yellow-500 px-4 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-yellow-600 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creando cuenta...
          </span>
        ) : (
          'Registrarte'
        )}
      </button>
    </form>
  )
}
