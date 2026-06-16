import { useEffect, useMemo, useState } from 'react'
import ProductTable from './components/ProductTable'
import ProductForm, { type ProductFormValues } from './components/ProductForm'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import {
  createProduct,
  updateProductById,
} from '../products/api'
import { uploadMediaFile } from '../media/api'
import { getBusinessById } from '../businesses/api'
import { getPrimaryBusinessId } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

type ProductRow = {
  id: number
  name: string
  slug: string
  shortDescription?: string | null
  description?: string | null
  ingredients?: string | null
  price: number | string
  imageUrl?: string | null
  isFeatured?: boolean
  isActive: boolean
  sortOrder?: number
  category?: { id: number; name: string }
}

type BusinessDetail = {
  id: number
  name: string
  category?: string
  menus?: Array<{
    id: number
    name: string
    categories?: Array<{
      id: number
      name: string
      menuId: number
      description?: string | null
    }>
  }>
  products?: ProductRow[]
}

const EMPTY_FORM: ProductFormValues = {
  businessId: '',
  categoryId: '',
  name: '',
  slug: '',
  category: '',
  shortDescription: '',
  description: '',
  ingredients: '',
  price: '',
  imageUrl: '',
  isFeatured: false,
  isActive: true,
  sortOrder: '',
}

export default function AdminProductsPage() {
  const businessId = getPrimaryBusinessId()
  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [formInitialValues, setFormInitialValues] =
    useState<ProductFormValues>(EMPTY_FORM)

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
        setError(getErrorMessage(err, 'No pudimos cargar los productos del negocio'))
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [businessId])

  const rows = useMemo(() => business?.products ?? [], [business])
  const categoryOptions = useMemo(() => {
    const menus = business?.menus ?? []

    return menus.flatMap((menu) =>
      (menu.categories ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        menuName: menu.name,
      }))
    )
  }, [business])

  function openCreateModal() {
    setEditingProduct(null)
    setFormInitialValues({
      ...EMPTY_FORM,
      businessId: String(businessId ?? ''),
    })
    setOpen(true)
  }

  function openEditModal(product: ProductRow) {
    setEditingProduct(product)
    setFormInitialValues({
      businessId: String(businessId ?? ''),
      categoryId: String(product.category?.id ?? ''),
      name: product.name,
      slug: product.slug,
      category: product.category?.name ?? '',
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      ingredients: product.ingredients ?? '',
      price: String(product.price),
      imageUrl: product.imageUrl ?? '',
      isFeatured: product.isFeatured ?? false,
      isActive: product.isActive,
      sortOrder: String(product.sortOrder ?? ''),
    })
    setOpen(true)
  }

  async function handleSubmit(values: ProductFormValues) {
    if (!businessId) return

    setSaving(true)
    setError('')

    try {
      const payload = {
        businessId,
        categoryId: Number(values.categoryId),
        name: values.name,
        slug: values.slug,
        shortDescription: values.shortDescription || null,
        description: values.description || null,
        ingredients: values.ingredients || null,
        price: Number(values.price),
        imageUrl: values.imageUrl || null,
        isFeatured: values.isFeatured,
        isActive: values.isActive,
        sortOrder: values.sortOrder ? Number(values.sortOrder) : 0,
      }

      if (editingProduct) {
        await updateProductById(editingProduct.id, payload)
      } else {
        await createProduct(payload)
      }

      const refreshed = await getBusinessById<BusinessDetail>(businessId)
      setBusiness(refreshed)
      setOpen(false)
      setEditingProduct(null)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos guardar el producto'))
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadImage(file: File) {
    if (!businessId) {
      throw new Error('Esta cuenta todavía no tiene un negocio asociado.')
    }

    const formData = new FormData()
    formData.append('businessId', String(businessId))
    formData.append('file', file)

    const media = await uploadMediaFile(formData)
    return media.url as string
  }

  async function handleToggleStatus(product: ProductRow) {
    if (!businessId) return

    setSaving(true)
    setError('')

    try {
      await updateProductById(product.id, {
        isActive: !product.isActive,
      })

      const refreshed = await getBusinessById<BusinessDetail>(businessId)
      setBusiness(refreshed)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos actualizar el estado del producto'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Cargando catálogo...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Productos
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Gestiona la carta de productos
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Publica platos, ajusta precios y mantén disponible lo que tus clientes pueden pedir.
          </p>
          {business ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {business.name}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {categoryOptions.length} categorías disponibles
              </span>
            </div>
          ) : null}
        </div>

        <Button onClick={openCreateModal}>Crear producto</Button>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Productos publicados</CardTitle>
          <CardDescription>
            Todo lo que aparece o puede aparecer en la carta del negocio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTable
            items={rows.map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category?.name,
              price: item.price,
              isActive: item.isActive,
              imageUrl: item.imageUrl || undefined,
            }))}
            onEdit={(id) => {
              const product = rows.find((item) => item.id === id)
              if (product) openEditModal(product)
            }}
            onToggleStatus={(id) => {
              const product = rows.find((item) => item.id === id)
              if (product) handleToggleStatus(product)
            }}
          />
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingProduct ? 'Editar producto' : 'Crear producto'}
        description="Completa la información que ayuda a vender mejor cada plato."
        size="lg"
      >
        <ProductForm
          initialValues={formInitialValues}
          loading={saving}
          onSubmit={handleSubmit}
          onUploadImage={handleUploadImage}
          businessName={business?.name}
          businessCategory={business?.category}
          categoryOptions={categoryOptions}
        />
      </Modal>
    </div>
  )
}
