import type { MenuCategoryWithProducts } from '../../../types'
import { MenuItemCard } from './MenuItemCard'

interface MenuCategorySectionProps {
  id?: string
  category: MenuCategoryWithProducts
  businessName: string
  businessCategory?: string
  onOpenProduct?: (productId: string) => void
  onOrder?: (productName: string) => void
}

export function MenuCategorySection({
  category,
  businessName,
  businessCategory,
  onOpenProduct,
  onOrder,
  id,
}: MenuCategorySectionProps) {
  const sorted = [...(category.products ?? [])].sort((a, b) => {
    const featDiff = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured))
    if (featDiff !== 0) return featDiff
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Sección de carta</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">{category.name}</h3>
          {category.description && (
            <p className="mt-2 text-sm leading-6 text-neutral-500">{category.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5">
            {sorted.length} producto{sorted.length === 1 ? '' : 's'}
          </span>
          {businessCategory && (
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5">
              {businessCategory}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((product) => (
          <MenuItemCard
            key={product.id}
            product={product}
            businessName={businessName}
            onOpenProduct={onOpenProduct ? () => onOpenProduct(product.id) : undefined}
            onOrder={onOrder ? () => onOrder(product.name) : undefined}
          />
        ))}
      </div>
    </section>
  )
}
