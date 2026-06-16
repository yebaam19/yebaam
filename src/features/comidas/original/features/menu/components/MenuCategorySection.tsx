import type { MenuCategory } from '../api'
import MenuItemCard from './MenuItemCard'

export interface MenuCategorySectionProps {
  id?: string
  category: MenuCategory
  businessName: string
  businessCategory?: string
  onOpenProduct?: (productId: number) => void
  onOrder?: (productName: string) => void
}

export default function MenuCategorySection({
  category,
  businessName,
  businessCategory,
  onOpenProduct,
  onOrder,
  id,
}: MenuCategorySectionProps) {
  const sortedProducts = [...category.products].sort((left, right) => {
    const featuredDiff = Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured))

    if (featuredDiff !== 0) return featuredDiff

    return (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
  })

  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
            Sección de carta
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {category.name}
          </h3>
          {category.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            {sortedProducts.length} producto{sortedProducts.length === 1 ? '' : 's'}
          </span>
          {businessCategory ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5">
              {businessCategory}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedProducts.map((product) => (
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
