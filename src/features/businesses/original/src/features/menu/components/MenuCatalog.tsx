import Badge from '../../../components/ui/Badge'
import type { MenuCategory } from '../api'
import MenuCategoryNav from './MenuCategoryNav'
import MenuCategorySection from './MenuCategorySection'

export interface MenuCatalogProps {
  businessName: string
  businessCategory?: string
  categories: MenuCategory[]
  activeCategoryId?: number | null
  onSelectCategory?: (id: number) => void
  onOpenProduct?: (productId: number) => void
  onOrder?: (productName: string) => void
}

export default function MenuCatalog({
  businessName,
  businessCategory,
  categories,
  activeCategoryId,
  onSelectCategory,
  onOpenProduct,
  onOrder,
}: MenuCatalogProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
          Carta
        </p>
        <p className="mt-2 text-base font-semibold text-slate-950">
          Esta carta todavía no tiene categorías visibles.
        </p>
        <p className="mt-2 max-w-xl leading-6">
          Cuando el negocio publique su menú, podrás recorrerlo por secciones y encontrar
          platos con mayor facilidad.
        </p>
      </div>
    )
  }

  const navItems = categories.map((category) => ({
    id: category.id,
    label: category.name,
  }))

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-20 rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
              Categorías
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Muévete entre secciones sin perder el hilo de la carta.
            </p>
          </div>
          <Badge variant="neutral">{categories.length} secciones</Badge>
        </div>

        <MenuCategoryNav
          items={navItems}
          activeId={activeCategoryId}
          onSelect={onSelectCategory}
        />
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <MenuCategorySection
            key={category.id}
            id={`menu-category-${category.id}`}
            category={category}
            businessName={businessName}
            businessCategory={businessCategory}
            onOpenProduct={onOpenProduct}
            onOrder={onOrder}
          />
        ))}
      </div>
    </div>
  )
}
