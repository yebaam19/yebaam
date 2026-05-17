import { CityMenu } from '@/features/cities'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

/**
 * Layout para la página de detalle de ciudad
 * Incluye el menú lateral
 */
export default async function CityLayout({ children, params }: Props) {
  const { slug } = await params

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex gap-6">
        {/* Contenido principal */}
        <div className="min-w-0 flex-1">{children}</div>

        {/* Menú lateral - Solo desktop */}
        <div className="sticky top-20 hidden h-fit w-64 shrink-0 lg:block">
          <CityMenu citySlug={slug} />
        </div>
      </div>

      {/* Menú mobile - Floating button (se renderiza dentro de CityMenu) */}
      <div className="lg:hidden">
        <CityMenu citySlug={slug} />
      </div>
    </div>
  )
}
