import { useEffect, useState } from 'react'
import MediaUploader from './components/MediaUploader'
import Button from '../../components/ui/Button'
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { getBusinessById } from '../businesses/api'
import { setPrimaryMedia, uploadMediaFile } from '../media/api'
import { getPrimaryBusinessId } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

type MediaAsset = {
  id: number
  url: string
  type: 'IMAGE' | 'VIDEO'
  isPrimary: boolean
}

type BusinessDetail = {
  id: number
  name: string
  mediaAssets?: MediaAsset[]
}

export default function AdminMediaPage() {
  const businessId = getPrimaryBusinessId()
  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

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
        setBusiness(data)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar la galería del negocio'))
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [businessId])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !businessId) return

    setUploading(true)
    setError('')

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('businessId', String(businessId))
        formData.append('file', file)
        await uploadMediaFile(formData)
      }

      const refreshed = await getBusinessById<BusinessDetail>(businessId)
      setBusiness(refreshed)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos subir los archivos'))
    } finally {
      setUploading(false)
    }
  }

  async function handlePrimaryChange(mediaAssetId: number, nextPrimary: boolean) {
    if (!businessId) return

    setUploading(true)
    setError('')

    try {
      await setPrimaryMedia(businessId, mediaAssetId, nextPrimary)
      const refreshed = await getBusinessById<BusinessDetail>(businessId)
      setBusiness(refreshed)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos actualizar el recurso principal'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div>Cargando galería...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
          Galería
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Administra fotos y videos
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Renueva la primera impresión visual del negocio con contenido claro y reciente.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">{error}</CardContent>
        </Card>
      ) : null}

      <MediaUploader onUpload={handleUpload} />

      <Card>
        <CardHeader>
          <CardTitle>Contenido publicado</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(business?.mediaAssets ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay fotos ni videos publicados.
            </p>
          ) : (
            business?.mediaAssets?.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
              >
                <img
                  src={item.url}
                  alt={`media-${item.id}`}
                  className="h-52 w-full object-cover"
                />
                <div className="space-y-3 p-4 text-sm text-slate-600">
                  <div>
                    {item.type}
                    {item.isPrimary ? ' · Principal' : ''}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.isPrimary ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrimaryChange(item.id, false)}
                        loading={uploading}
                      >
                        Quitar como principal
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePrimaryChange(item.id, true)}
                        loading={uploading}
                      >
                        Usar como principal
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {uploading ? (
        <p className="text-sm text-slate-500">Subiendo archivos...</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Contenido por producto</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Para asociar contenido a un producto, usa la ficha del producto correspondiente.
          Esta sección administra la galería general del negocio.
        </CardContent>
      </Card>
    </div>
  )
}
