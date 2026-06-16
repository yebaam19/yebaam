import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import BusinessForm, { type BusinessFormValues } from './components/BusinessForm'
import { createBusiness } from '../businesses/api'
import { getStoredUser, prependBusinessIdToStoredUser } from '../../lib/session'

type CreatedBusiness = {
  id: number
  name: string
}

export default function AdminBusinessCreatePage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const [saving, setSaving] = useState(false)

  async function handleCreate(values: BusinessFormValues) {
    if (!isSuperAdmin) {
      throw new Error('Solo un superadministrador puede crear negocios.')
    }

    setSaving(true)

    try {
      const created = await createBusiness<CreatedBusiness>({
        name: values.name,
        slug: values.slug || null,
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
        adminName: values.adminName || null,
        adminEmail: values.adminEmail || values.email || null,
        adminPassword: values.adminPassword || null,
      })

      prependBusinessIdToStoredUser(created.id)
      navigate(`/admin/businesses/${created.id}/edit`, { replace: true })
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
            Solo un superadministrador puede crear nuevos negocios.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
          Super administración
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Crear una nueva vitrina
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Registra el negocio, crea su acceso administrativo y deja lista su base pública.
        </p>
      </div>

      <BusinessForm
        allowFileUpload={false}
        showAccessCredentials
        showAdminName
        showLogo
        showSlug
        showStatus
        onSubmit={handleCreate}
        loading={saving}
      />

      <Card>
        <CardHeader>
          <CardTitle>Antes de publicar</CardTitle>
          <CardDescription>
            Para este alta inicial, logo y portada se reciben como URL directa. Luego podrás
            gestionar imágenes desde la galería del panel.
          </CardDescription>
        </CardHeader>
      </Card>

      <Button variant="ghost" onClick={() => navigate('/admin/businesses')}>
        Volver a negocios
      </Button>
    </div>
  )
}
