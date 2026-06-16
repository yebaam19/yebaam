import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { getBusinessById } from '../businesses/api'
import { uploadMediaFile } from '../media/api'
import {
  createPromotion,
  deactivatePromotionById,
  listPromotionsByBusinessId,
  updatePromotionById,
  type PromotionRecord,
  type PromotionStatus,
} from '../promotions/api'
import { getPrimaryBusinessId } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

type BusinessSummary = {
  id: number
  name: string
}

type PromotionFormState = {
  title: string
  slug: string
  description: string
  imageUrl: string
  ctaLabel: string
  ctaUrl: string
  startsAt: string
  endsAt: string
  status: PromotionStatus
  isHighlighted: boolean
}

const emptyForm: PromotionFormState = {
  title: '',
  slug: '',
  description: '',
  imageUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  startsAt: '',
  endsAt: '',
  status: 'DRAFT',
  isHighlighted: false,
}

function isValidPromotionUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false

  if (trimmed.startsWith('/')) return true

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Fecha por definir'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha por definir'

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminPromotionsPage() {
  const businessId = getPrimaryBusinessId()
  const [business, setBusiness] = useState<BusinessSummary | null>(null)
  const [promotions, setPromotions] = useState<PromotionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null)
  const [form, setForm] = useState<PromotionFormState>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageUploadError, setImageUploadError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  async function loadData() {
    if (!businessId) {
      setError('Esta cuenta todavía no tiene un negocio asociado.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const [businessData, promotionsData] = await Promise.all([
        getBusinessById<BusinessSummary>(businessId),
        listPromotionsByBusinessId(businessId),
      ])

      setBusiness(businessData)
      setPromotions(promotionsData)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos cargar las promociones'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const promotionsCount = useMemo(() => promotions.length, [promotions])

  function openCreateModal() {
    setEditingPromotionId(null)
    setForm({
      ...emptyForm,
      status: 'DRAFT',
    })
    setImageFile(null)
    setImagePreview('')
    setImageUploadError('')
    setModalOpen(true)
  }

  function openEditModal(promotion: PromotionRecord) {
    setEditingPromotionId(promotion.id)
    setForm({
      title: promotion.title ?? '',
      slug: promotion.slug ?? '',
      description: promotion.description ?? '',
      imageUrl: promotion.imageUrl ?? '',
      ctaLabel: promotion.ctaLabel ?? '',
      ctaUrl: promotion.ctaUrl ?? '',
      startsAt: toDateTimeLocalValue(promotion.startsAt),
      endsAt: toDateTimeLocalValue(promotion.endsAt),
      status: promotion.status,
      isHighlighted: Boolean(promotion.isHighlighted),
    })
    setImageFile(null)
    setImagePreview('')
    setImageUploadError('')
    setModalOpen(true)
  }

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return
    }

    const preview = URL.createObjectURL(imageFile)
    setImagePreview(preview)

    return () => URL.revokeObjectURL(preview)
  }, [imageFile])

  function updateField<K extends keyof PromotionFormState>(
    key: K,
    value: PromotionFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!businessId) return

    try {
      setSaving(true)
      setImageUploadError('')

      let nextImageUrl = form.imageUrl.trim()

      if (imageFile) {
        setImageUploading(true)
        const formData = new FormData()
        formData.append('businessId', String(businessId))
        formData.append('file', imageFile)
        const media = await uploadMediaFile(formData)
        nextImageUrl = media?.url ? String(media.url) : ''
      }

      if (!nextImageUrl) {
        setImageUploadError('Sube una imagen o pega una URL válida antes de guardar.')
        return
      }

      if (form.ctaUrl.trim() && !isValidPromotionUrl(form.ctaUrl)) {
        setError('El enlace del botón debe ser una URL válida o una ruta interna que comience con /.')
        return
      }

      const startsAt = form.startsAt || null
      const endsAt = form.endsAt || null

      if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
        setError('La fecha de inicio no puede ser posterior a la fecha de cierre.')
        return
      }

      const payload = {
        businessId,
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        description: form.description.trim() || null,
        imageUrl: nextImageUrl,
        ctaLabel: form.ctaLabel.trim() || null,
        ctaUrl: form.ctaUrl.trim() || null,
        startsAt,
        endsAt,
        status: form.status,
        isHighlighted: form.isHighlighted,
      }

      if (editingPromotionId) {
        await updatePromotionById(editingPromotionId, payload)
      } else {
        await createPromotion(payload)
      }

      setModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos guardar la promoción'))
    } finally {
      setSaving(false)
      setImageUploading(false)
    }
  }

  async function handleDeactivate(promotion: PromotionRecord) {
    const confirm = window.confirm(
      `¿Quieres desactivar la promoción "${promotion.title}"?`
    )
    if (!confirm) return

    try {
      setSaving(true)
      await deactivatePromotionById(promotion.id)
      await loadData()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos desactivar la promoción'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Cargando promociones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Promociones
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {business?.name || 'Tu negocio'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Crea ofertas claras, define su vigencia y decide cuándo mostrarlas en tu vitrina.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="neutral">{promotionsCount} promociones</Badge>
          <Button onClick={openCreateModal}>Crear promoción</Button>
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

      {promotions.length === 0 ? (
        <EmptyState
          title="Aún no hay promociones registradas"
          description="Crea una primera oferta para destacar una campaña, combo o beneficio vigente."
          actionLabel="Crear promoción"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid gap-5">
          {promotions.map((promotion) => (
            <Card key={promotion.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="mb-0">{promotion.title}</CardTitle>
                      <Badge
                        variant={
                          promotion.status === 'ACTIVE'
                            ? 'success'
                            : promotion.status === 'DRAFT'
                            ? 'warning'
                            : promotion.status === 'EXPIRED'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {promotion.status}
                      </Badge>
                      {promotion.isHighlighted ? (
                        <Badge variant="success">Destacada</Badge>
                      ) : null}
                    </div>

                    <CardDescription>
                      {promotion.description || 'Descripción pendiente por completar'}
                    </CardDescription>

                    <p className="text-xs text-slate-500">
                      Vigencia: {formatDateLabel(promotion.startsAt)} -{' '}
                      {formatDateLabel(promotion.endsAt)}
                    </p>
                  </div>

                  {promotion.business?.name ? (
                    <p className="text-sm font-medium text-slate-500">
                      {promotion.business.name}
                    </p>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => openEditModal(promotion)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDeactivate(promotion)}
                  disabled={saving}
                >
                  Desactivar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPromotionId ? 'Editar promoción' : 'Nueva promoción'}
        description="Escribe una promesa clara, una vigencia entendible y una acción fácil de seguir."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              form="promotion-form"
              type="submit"
              loading={saving || imageUploading}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="promotion-form" className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Imagen de la promoción
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
            />
            <p className="text-sm text-slate-500">
              Sube una imagen o pega una URL directa. Una buena imagen aumenta la claridad de la oferta.
            </p>
            {(imagePreview || form.imageUrl) && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                  src={imagePreview || form.imageUrl}
                  alt={form.title || 'Imagen de promoción'}
                  className="h-48 w-full object-cover"
                />
              </div>
            )}
            {imageUploadError ? (
              <p className="text-sm text-red-600">{imageUploadError}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Título"
              value={form.title}
              onChange={(event) => {
                const nextTitle = event.target.value
                setForm((current) => ({
                  ...current,
                  title: nextTitle,
                  slug: current.slug || slugify(nextTitle),
                }))
              }}
              placeholder="2x1 en helados"
              required
            />

            <Input
              label="Slug"
              value={form.slug}
              onChange={(event) => updateField('slug', event.target.value)}
              placeholder="2x1-en-helados"
              hint="Se genera automáticamente si lo dejas vacío."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={4}
              placeholder="Ej. Lleva dos helados artesanales y paga uno hasta el domingo."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Imagen"
              value={form.imageUrl}
              onChange={(event) => updateField('imageUrl', event.target.value)}
              placeholder="https://..."
              hint="Obligatoria para guardar la promoción."
            />

            <Input
              label="Texto del botón"
              value={form.ctaLabel}
              onChange={(event) => updateField('ctaLabel', event.target.value)}
              placeholder="Pedir ahora"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Enlace del botón"
              value={form.ctaUrl}
              onChange={(event) => updateField('ctaUrl', event.target.value)}
              placeholder="https://wa.me/..."
              hint="Opcional. Puedes usar una URL externa o una ruta interna que empiece por /."
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField('status', event.target.value as PromotionStatus)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activa</option>
                <option value="EXPIRED">Expirada</option>
                <option value="ARCHIVED">Archivada</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Fecha de inicio"
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => updateField('startsAt', event.target.value)}
            />

            <Input
              label="Fecha de cierre"
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => updateField('endsAt', event.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isHighlighted}
              onChange={(event) => updateField('isHighlighted', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-200"
            />
            Destacar esta promoción
          </label>
        </form>
      </Modal>
    </div>
  )
}
