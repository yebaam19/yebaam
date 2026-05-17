import { BusinessList } from '@/features/cities/components/directory/BusinessList'
import { DirectoryHero } from '@/features/cities/components/directory/DirectoryHero'
import { cityService } from '@/features/cities/services/city.service'
import { directoryService } from '@/features/cities/services/directory.service'
import { ChevronRightIcon, HomeIcon } from '@/components/icons/heroicons-shim'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface BusinessesPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Genera metadata dinámica para SEO
 */
export async function generateMetadata({ params }: BusinessesPageProps): Promise<Metadata> {
  const { slug } = await params
  const city = await cityService.getCityBySlug(slug)

  if (!city) {
    return {
      title: 'Ciudad no encontrada',
    }
  }

  return {
    title: `Negocios en ${city.name} | Directorio`,
    description: `Descubre los mejores negocios en ${city.name}. Restaurantes, tiendas, tecnología y más.`,
  }
}

/**
 * Página de listado de negocios de una ciudad
 * Server Component - fetches data and passes to client components
 */
export default async function BusinessesPage({ params }: BusinessesPageProps) {
  const { slug } = await params
  const city = await cityService.getCityBySlug(slug)

  if (!city) {
    notFound()
  }

  // Obtener negocios y categorías
  const [businessesResponse, categories] = await Promise.all([
    directoryService.getBusinessesByCity(city.id),
    directoryService.getBusinessCategories(),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/feed" className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400">
          <HomeIcon className="h-4 w-4" />
          <span>Inicio</span>
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <Link href="/cities" className="hover:text-primary-600 dark:hover:text-primary-400">
          Ciudades
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <Link href={`/cities/${slug}`} className="hover:text-primary-600 dark:hover:text-primary-400">
          {city.name}
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <Link
          href={`/cities/${slug}/directory`}
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          Directorio
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="font-medium text-neutral-900 dark:text-neutral-100">Negocios</span>
      </nav>

      {/* Hero Section */}
      <DirectoryHero cityName={city.name} type="businesses" />

      {/* Lista de negocios */}
      <section>
        <BusinessList businesses={businessesResponse.businesses} categories={categories} />
      </section>
    </div>
  )
}
