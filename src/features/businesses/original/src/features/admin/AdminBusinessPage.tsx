import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTrash } from 'react-icons/fa6'
import Card, {
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import BusinessForm, {
  type BusinessFormValues,
} from './components/BusinessForm'
import {
  deleteBusinessById,
  getBusinessById,
  updateBusinessById,
} from '../businesses/api'
import { uploadMediaFile } from '../media/api'
import {
  getPrimaryBusinessId,
  getStoredUser,
  removeBusinessIdFromStoredUser,
} from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

type BusinessDetail = BusinessFormValues & {
  id: number
  businessType?: string | null
  aboutArticle?: string | null
  website?: string | null
  instagram?: string | null
  mediaAssets?: Array<{
    id: number
    url: string
    isPrimary?: boolean
  }>
}

export default function AdminBusinessPage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const businessId = getPrimaryBusinessId()
  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadBusiness() {
      if (!businessId) {
        setError('Esta cuenta todavía no tiene un negocio asociado.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getBusinessById<BusinessDetail>(businessId)
        setBusiness({
          ...data,
          businessType: data.businessType || '',
          aboutArticle: data.aboutArticle || '',
          website: data.website || '',
          instagram: data.instagram || '',
          coverImageUrl:
            data.mediaAssets?.find((item) => item.isPrimary)?.url ||
            data.mediaAssets?.[0]?.url ||
            '',
        })
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar el negocio'))
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [businessId])

  async function handleSubmit(values: BusinessFormValues) {
    if (!businessId) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await updateBusinessById<BusinessDetail>(businessId, {
        name: values.name,
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
      })

      setBusiness({
        ...updated,
        businessType: updated.businessType || '',
        aboutArticle: updated.aboutArticle || '',
        website: updated.website || '',
        instagram: updated.instagram || '',
        coverImageUrl:
          updated.mediaAssets?.find((item) => item.isPrimary)?.url ||
          updated.mediaAssets?.[0]?.url ||
          '',
      })
      setSuccess('El perfil del negocio se actualizó correctamente.')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos guardar los cambios del negocio'))
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadCover(file: File) {
    if (!businessId) {
      throw new Error('Esta cuenta todavía no tiene un negocio asociado.')
    }

    const formData = new FormData()
    formData.append('businessId', String(businessId))
    formData.append('isPrimary', 'true')
    formData.append('file', file)

    const media = await uploadMediaFile(formData)
    return media.url as string
  }

  async function handleDeleteBusiness() {
    if (!businessId || !business || !isSuperAdmin) return

    const confirmed = window.confirm(
      `¿Eliminar "${business.name}"? Esta acción borrará el negocio y todo su contenido asociado.`
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      await deleteBusinessById(businessId)
      removeBusinessIdFromStoredUser(businessId)
      navigate('/admin/businesses', { replace: true })
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos eliminar el negocio'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div>Cargando negocio...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
          Negocio
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Editar vitrina del negocio
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ajusta datos, contacto e historia para que los usuarios sepan por qué elegirte.
            </p>
          </div>

          {business && isSuperAdmin ? (
            <button
              type="button"
              onClick={handleDeleteBusiness}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaTrash className="mr-2 text-xs" />
              {deleting ? 'Eliminando...' : 'Eliminar negocio'}
            </button>
          ) : null}
        </div>
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
          loading={saving}
          onSubmit={handleSubmit}
          onUploadCover={handleUploadCover}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sin negocio asociado</CardTitle>
            <CardDescription>
              No encontramos un negocio vinculado a esta sesión.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
