import { DirectoryCategoriesGrid } from '@/features/cities/components/directory/DirectoryCategoriesGrid'
import { DirectoryHero } from '@/features/cities/components/directory/DirectoryHero'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { ChevronRightIcon, HomeIcon } from '@/components/icons/heroicons-shim'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface DirectoryPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Genera metadata dinámica para SEO
 */
export async function generateMetadata({ params }: DirectoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const city = await getCityBySlug(slug)

  if (!city) {
    return {
      title: 'Ciudad no encontrada',
    }
  }

  return {
    title: `Directorio de ${city.name} | Negocios y Servicios`,
    description: `Explora el directorio de negocios y servicios profesionales en ${city.name}. Encuentra restaurantes, tiendas, profesionales y más.`,
  }
}

/**
 * Página principal del directorio de una ciudad
 * Server Component - fetches data and renders static content
 */
export default async function DirectoryPage({ params }: DirectoryPageProps) {
  const { slug } = await params
  const city = await getCityBySlug(slug)

  if (!city) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/feed" className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400">
          <HomeIcon className="h-4 w-4" />
          <span>Inicio</span>
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <Link
          href="/cities"
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          Ciudades
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <Link
          href={`/cities/${slug}`}
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          {city.name}
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="font-medium text-neutral-900 dark:text-neutral-100">Directorio</span>
      </nav>

      {/* Hero Section */}
      <DirectoryHero cityName={city.name} type="main" />

      {/* Descripción */}
      <section className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-3 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Directorio Completo de {city.name}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Explora todos los negocios, servicios profesionales e instituciones en {city.name}. Desde restaurantes y
          tiendas hasta profesionales de confianza, centros médicos y más. Encuentra todo lo que necesitas en un solo
          lugar.
        </p>
      </section>

      {/* Categorías del directorio */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Explora por categoría</h2>
        <DirectoryCategoriesGrid citySlug={slug} />
      </section>
    </div>
  )
}
