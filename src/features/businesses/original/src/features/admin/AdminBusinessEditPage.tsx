import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card, {
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import BusinessForm, {
  type BusinessAdminOption,
  type BusinessFormValues,
} from './components/BusinessForm'
import {
  getBusinessForAdminById,
  updateBusinessById,
} from '../businesses/api'
import { listBusinessAdmins } from './api'
import { getStoredUser } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

type AdminBusinessDetail = BusinessFormValues & {
  id: number
  mediaAssets?: Array<{ id: number; url: string; isPrimary?: boolean }>
  primaryAdmin?: { id: number; name: string; email: string; isActive: boolean } | null
}

export default function AdminBusinessEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const [business, setBusiness] = useState<AdminBusinessDetail | null>(null)
  const [adminOptions, setAdminOptions] = useState<BusinessAdminOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function load() {
      if (!id || !isSuperAdmin) return

      try {
        setLoading(true)
        setError('')
        const [businessData, admins] = await Promise.all([
          getBusinessForAdminById<AdminBusinessDetail>(id),
          listBusinessAdmins(),
        ])

        setBusiness({
          ...businessData,
          slug: businessData.slug || '',
          businessType: businessData.businessType || '',
          description: businessData.description || '',
          aboutArticle: businessData.aboutArticle || '',
          city: businessData.city || '',
          address: businessData.address || '',
          phone: businessData.phone || '',
          whatsapp: businessData.whatsapp || '',
          email: businessData.email || '',
          website: businessData.website || '',
          instagram: businessData.instagram || '',
          profileImageUrl: businessData.profileImageUrl || '',
          coverImageUrl:
            businessData.mediaAssets?.find((item) => item.isPrimary)?.url ||
            businessData.mediaAssets?.[0]?.url ||
            '',
          primaryAdminUserId: businessData.primaryAdmin?.id ?? null,
        })
        setAdminOptions(admins)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar el negocio'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, isSuperAdmin])

  async function handleSubmit(values: BusinessFormValues) {
    if (!id || !business) return

    const slugChanged = values.slug && values.slug !== business.slug
    const confirmSlugChange =
      !slugChanged ||
      !business.isActive ||
      window.confirm(
        'Cambiar el slug de un negocio activo puede afectar sus URLs públicas. ¿Quieres continuar?'
      )

    if (!confirmSlugChange) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const updated = await updateBusinessById<AdminBusinessDetail>(id, {
        name: values.name,
        slug: values.slug || undefined,
        category: values.category,
        businessType: values.businessType || null,
        description: values.description || null,
        aboutArticle: values.aboutArticle || null,
        city: values.city || null,
        address: values.address || null,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        email: values.email || null,
        website: values.website || null,
        instagram: values.instagram || null,
        coverImageUrl: values.coverImageUrl || null,
        profileImageUrl: values.profileImageUrl || null,
        isActive: values.isActive,
        primaryAdminUserId: values.primaryAdminUserId ?? null,
        confirmSlugChange: Boolean(slugChanged),
      })

      setBusiness({
        ...business,
        ...values,
        slug: updated.slug || values.slug,
      })
      setSuccess('El negocio se actualizó correctamente.')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos guardar los cambios'))
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
          <CardDescription>
            Esta sección está disponible solo para superadministradores.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) return <div>Cargando negocio...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Super administración
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Editar vitrina
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Actualiza datos públicos, estado de publicación y administrador principal.
          </p>
        </div>
        <Link to="/admin/businesses">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {success ? (
        <Card>
          <CardHeader>
            <CardTitle>Guardado</CardTitle>
            <CardDescription>{success}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {business ? (
        <BusinessForm
          initialValues={business}
          showSlug
          showLogo
          showStatus
          showAdminAssignment
          businessAdminOptions={adminOptions}
          onSubmit={handleSubmit}
          loading={saving}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Negocio no disponible</CardTitle>
            <CardDescription>No encontramos el negocio solicitado.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Button variant="ghost" onClick={() => navigate('/admin/businesses')}>
        Volver a negocios
      </Button>
    </div>
  )
}
