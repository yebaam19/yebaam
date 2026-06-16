import { getBusinessById, listBusinesses } from '../businesses/api'

export type HomeBusinessItem = {
  id: number
  name: string
  category?: string | null
  description?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  whatsapp?: string | null
  ratingAverage: number
  reviewsCount: number
  activePromotionsCount: number
  coverUrl?: string | null
  productsCount: number
}

export type HomeProductItem = {
  id: number
  businessId: number
  businessName: string
  businessCategory?: string | null
  name: string
  shortDescription?: string | null
  description?: string | null
  price: number | string
  currency?: string | null
  imageUrl?: string | null
  categoryName?: string | null
  isFeatured?: boolean
  businessRating: number
}

export type HomeCatalog = {
  businesses: HomeBusinessItem[]
  products: HomeProductItem[]
}

type BusinessDetail = {
  id: number
  name: string
  category?: string | null
  description?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  whatsapp?: string | null
  ratingAverage?: number
  reviewsCount?: number
  activePromotionsCount?: number
  mediaAssets?: Array<{
    url?: string | null
    isPrimary?: boolean
  }>
  products?: Array<{
    id: number
    name: string
    shortDescription?: string | null
    description?: string | null
    price: number | string
    currency?: string | null
    imageUrl?: string | null
    isFeatured?: boolean
    isActive?: boolean
    category?: {
      name?: string | null
    } | null
  }>
}

export async function loadHomeCatalog(): Promise<HomeCatalog> {
  const businesses = await listBusinesses()

  const details = await Promise.all(
    businesses.map((business) => getBusinessById<BusinessDetail>(business.id))
  )

  const mappedBusinesses: HomeBusinessItem[] = details.map((business) => {
    const primaryMedia =
      business.mediaAssets?.find((item) => item.isPrimary) ||
      business.mediaAssets?.[0] ||
      null

    return {
      id: business.id,
      name: business.name,
      category: business.category,
      description: business.description,
      city: business.city,
      address: business.address,
      phone: business.phone,
      whatsapp: business.whatsapp,
      ratingAverage: business.ratingAverage ?? 0,
      reviewsCount: business.reviewsCount ?? 0,
      activePromotionsCount: business.activePromotionsCount ?? 0,
      coverUrl: primaryMedia?.url ?? null,
      productsCount: business.products?.length ?? 0,
    }
  })

  const mappedProducts: HomeProductItem[] = details.flatMap((business) =>
    (business.products ?? [])
      .filter((product) => product.isActive !== false)
      .map((product) => ({
        id: product.id,
        businessId: business.id,
        businessName: business.name,
        businessCategory: business.category,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        currency: product.currency,
        imageUrl: product.imageUrl,
        categoryName: product.category?.name,
        isFeatured: product.isFeatured,
        businessRating: business.ratingAverage ?? 0,
      }))
  )

  return {
    businesses: mappedBusinesses,
    products: mappedProducts,
  }
}
