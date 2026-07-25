import Image from 'next/image'
import { cfImageUrl } from './BusinessHero'
import type { MenuWithCategories } from '../../../types'

function formatPrice(price: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}

interface Props {
  menus: MenuWithCategories[]
  businessName: string
}

export function BusinessMenuTab({ menus, businessName }: Props) {
  const allCategories = menus.flatMap((m) => m.categories ?? [])

  if (allCategories.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Carta</p>
        <p className="mt-2 text-base font-semibold text-neutral-950">Esta carta todavía no tiene categorías visibles.</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          Cuando el negocio publique su menú, podrás recorrerlo por secciones.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {allCategories.map((category) => {
        const products = [...(category.products ?? [])]
          .filter((p) => p.is_active !== false)
          .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0))

        if (products.length === 0) return null

        return (
          <section
            key={category.id}
            className="scroll-mt-28 rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Sección de carta</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">{category.name}</h3>
                {category.description && (
                  <p className="mt-2 text-sm leading-6 text-neutral-500">{category.description}</p>
                )}
              </div>
              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-500">
                {products.length} producto{products.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const imgUrl = cfImageUrl(product.cf_image_id)
                return (
                  <article
                    key={product.id}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative overflow-hidden">
                      <div className="aspect-[4/3] w-full bg-primary-50">
                        {imgUrl ? (
                          <Image
                            src={imgUrl} alt={product.name} fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl">🍽️</div>
                        )}
                      </div>
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                        {product.is_featured && (
                          <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-primary-700 shadow-sm">
                            Destacado
                          </span>
                        )}
                        <span className="ml-auto rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="space-y-1.5">
                        <h4 className="line-clamp-1 text-base font-semibold tracking-tight text-neutral-950">
                          {product.name}
                        </h4>
                        <p className="line-clamp-2 text-sm leading-6 text-neutral-500">
                          {product.short_description || product.description || `Un plato de ${businessName}.`}
                        </p>
                      </div>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
                        {businessName}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
