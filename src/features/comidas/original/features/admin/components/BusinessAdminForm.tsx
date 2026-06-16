import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import type { BusinessListItem } from '../../businesses/api'

export type BusinessAdminFormValues = {
  name: string
  email: string
  businessId: number | null
  isActive: boolean
  password: string
  passwordConfirm: string
}

type BusinessAdminFormProps = {
  mode: 'create' | 'edit'
  initialValues?: Partial<BusinessAdminFormValues>
  businesses: BusinessListItem[]
  loading?: boolean
  onSubmit: (values: BusinessAdminFormValues) => void | Promise<void>
}

export default function BusinessAdminForm({
  mode,
  initialValues = {},
  businesses,
  loading = false,
  onSubmit,
}: BusinessAdminFormProps) {
  const [values, setValues] = useState<BusinessAdminFormValues>({
    name: initialValues.name || '',
    email: initialValues.email || '',
    businessId: initialValues.businessId ?? null,
    isActive: initialValues.isActive ?? true,
    password: '',
    passwordConfirm: '',
  })
  const [formError, setFormError] = useState('')

  function handleChange<K extends keyof BusinessAdminFormValues>(
    key: K,
    value: BusinessAdminFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const password = values.password.trim()
    const passwordConfirm = values.passwordConfirm.trim()

    if (!values.name.trim()) {
      setFormError('Escribe el nombre del administrador.')
      return
    }

    if (!values.email.trim()) {
      setFormError('Escribe el correo del administrador.')
      return
    }

    if (mode === 'create' && !password) {
      setFormError('Define una contraseña inicial.')
      return
    }

    if (password || passwordConfirm) {
      if (password.length < 6) {
        setFormError('La contraseña debe tener al menos 6 caracteres.')
        return
      }

      if (password !== passwordConfirm) {
        setFormError('Las contraseñas no coinciden.')
        return
      }
    }

    await onSubmit({
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      password,
      passwordConfirm,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Crear administrador' : 'Editar administrador'}
        </CardTitle>
        <CardDescription>
          Define los datos de acceso y el negocio que podrá administrar esta cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Nombre"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Ej. Ana Gómez"
            />
            <Input
              label="Email"
              type="email"
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="admin@negocio.com"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Negocio asignado
              </label>
              <select
                value={values.businessId ?? ''}
                onChange={(event) =>
                  handleChange(
                    'businessId',
                    event.target.value ? Number(event.target.value) : null
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Sin negocio asignado</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                    {business.city ? ` - ${business.city}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex min-h-[72px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-slate-700">
                  Estado
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  Solo las cuentas activas pueden iniciar sesión.
                </span>
              </span>
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => handleChange('isActive', event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-orange-500"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label={mode === 'create' ? 'Contraseña inicial' : 'Nueva contraseña'}
              type="password"
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : 'Opcional'}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={values.passwordConfirm}
              onChange={(event) =>
                handleChange('passwordConfirm', event.target.value)
              }
              placeholder="Repite la contraseña"
            />
          </div>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <Button type="submit" loading={loading}>
            Guardar administrador
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
