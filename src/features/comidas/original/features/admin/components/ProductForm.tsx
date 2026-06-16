import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { getErrorMessage } from '../../../lib/httpError'

export interface ProductFormValues {
  businessId: string
  categoryId: string
  name: string
  slug: string
  category: string
  shortDescription: string
  description: string
  ingredients: string
  price: string
  imageUrl: string
  isFeatured: boolean
  isActive: boolean
  sortOrder: string
}

export type ProductCategoryOption = {
  id: number
  name: string
  menuName?: string
}

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>
  onSubmit?: (values: ProductFormValues) => void
  onUploadImage?: (file: File) => Promise<string>
  loading?: boolean
  businessName?: string
  businessCategory?: string
  categoryOptions?: ProductCategoryOption[]
}

export default function ProductForm({
  initialValues = {},
  onSubmit,
  onUploadImage,
  loading = false,
  businessName,
  businessCategory,
  categoryOptions = [],
}: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageUploadError, setImageUploadError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [values, setValues] = useState<ProductFormValues>({
    businessId: initialValues.businessId || '',
    categoryId: initialValues.categoryId || '',
    name: initialValues.name || '',
    slug: initialValues.slug || '',
    category: initialValues.category || '',
    shortDescription: initialValues.shortDescription || '',
    description: initialValues.description || '',
    ingredients: initialValues.ingredients || '',
    price: initialValues.price || '',
    imageUrl: initialValues.imageUrl || '',
    isFeatured: initialValues.isFeatured ?? false,
    isActive: initialValues.isActive ?? true,
    sortOrder: initialValues.sortOrder || '',
  })
  const [dirtySlug, setDirtySlug] = useState(Boolean(initialValues.slug))

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return
    }

    const preview = URL.createObjectURL(imageFile)
    setImagePreview(preview)

    return () => URL.revokeObjectURL(preview)
  }, [imageFile])

  function handleChange<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) {
    if (key === 'slug') setDirtySlug(true)
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleNameChange(value: string) {
    setValues((prev) => {
      const next = { ...prev, name: value }

      if (!dirtySlug && !prev.slug) {
        next.slug = slugify(value)
      }

      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setImageUploadError('')

      let nextImageUrl = values.imageUrl.trim()

      if (imageFile && onUploadImage) {
        setImageUploading(true)
        nextImageUrl = await onUploadImage(imageFile)
      }

      if (!nextImageUrl) {
        setImageUploadError('Sube una imagen o pega una URL antes de guardar.')
        return
      }

      await onSubmit?.({
        ...values,
        imageUrl: nextImageUrl,
      })
    } catch (error: unknown) {
      setImageUploadError(getErrorMessage(error, 'No pudimos subir la imagen'))
    } finally {
      setImageUploading(false)
    }
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
            {values.businessId ? 'Editar producto' : 'Nuevo producto'}
          </span>
          {businessName ? (
            <span className="text-sm text-slate-500">
              {businessName}
              {businessCategory ? ` · ${businessCategory}` : ''}
            </span>
          ) : null}
        </div>
        <CardTitle className="text-xl sm:text-2xl">Ficha del producto</CardTitle>
        <CardDescription>
          Escribe una ficha clara: nombre, foto, precio y una descripción que abra el apetito.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <SectionBlock
            eyebrow="1. Identidad"
            title="Nombre y ubicación"
            description="Define cómo se verá el producto dentro de la carta."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre"
                value={values.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Burger Doble"
              />

              <Input
                label="Slug"
                value={values.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="burger-doble"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Sección de la carta
                </label>
                <select
                  value={values.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">Selecciona una sección</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.menuName ? ` · ${category.menuName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Etiqueta visible"
                value={values.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="Ej. Hamburguesas"
              />
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="2. Contenido"
            title="Foto y relato"
            description="Una buena imagen y una descripción concreta ayudan a decidir."
          >
            <div className="space-y-3">
              <FieldLabel title="Imagen del producto" />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
              />
              <p className="text-sm text-slate-500">
                Sube una imagen o pega una URL directa. La imagen ayuda a que el plato destaque.
              </p>
              {(imagePreview || values.imageUrl) && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img
                    src={imagePreview || values.imageUrl}
                    alt={values.name || 'Vista previa'}
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
                label="Precio"
                value={values.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="Ej. 28000"
              />

              <Input
                label="URL de imagen"
                value={values.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                placeholder="https://..."
                hint="Necesaria si no subes un archivo."
              />
            </div>

            <div className="space-y-4">
              <FieldLabel title="Frase corta" />
              <textarea
                value={values.shortDescription}
                onChange={(e) => handleChange('shortDescription', e.target.value)}
                rows={3}
                placeholder="Ej. Doble carne, queso fundido y salsa de la casa"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div className="space-y-4">
              <FieldLabel title="Descripción completa" />
              <textarea
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                placeholder="Cuenta qué lo hace especial, cómo se sirve o para quién es ideal"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div className="space-y-4">
              <FieldLabel title="Ingredientes" />
              <textarea
                value={values.ingredients}
                onChange={(e) => handleChange('ingredients', e.target.value)}
                rows={2}
                placeholder="Ingrediente 1, ingrediente 2"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="3. Estado"
            title="Visibilidad"
            description="Controla si se publica y qué tan arriba aparece en la carta."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Orden"
                value={values.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                placeholder="Ej. 1"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleChip
                  label="Destacado"
                  checked={values.isFeatured}
                  onChange={(checked) => handleChange('isFeatured', checked)}
                />
                <ToggleChip
                  label="Activo"
                  checked={values.isActive}
                  onChange={(checked) => handleChange('isActive', checked)}
                />
              </div>
            </div>
          </SectionBlock>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Revisa sección, precio y foto antes de guardar.
            </p>
            <Button type="submit" loading={loading || imageUploading}>
              Guardar producto
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function SectionBlock({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function FieldLabel({ title }: { title: string }) {
  return <p className="text-sm font-medium text-slate-700">{title}</p>
}

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition',
        checked
          ? 'border-orange-200 bg-orange-50 text-orange-700'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      <span>{label}</span>
      <span
        className={[
          'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold',
          checked
            ? 'border-orange-500 bg-orange-500 text-white'
            : 'border-slate-300 bg-white text-transparent',
        ].join(' ')}
      >
        ✓
      </span>
    </button>
  )
}
