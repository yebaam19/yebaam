'use client'

import { useState } from 'react'
import type { MenuCategoryWithProducts } from '../../../types'
import { MenuCategoryNav } from './MenuCategoryNav'
import { MenuCategorySection } from './MenuCategorySection'

interface MenuCatalogProps {
  businessName: string
  businessCategory?: string
  categories: MenuCategoryWithProducts[]
  onOpenProduct?: (productId: string) => void
  onOrder?: (productName: string) => void
}

export function MenuCatalog({
  businessName,
  businessCategory,
  categories,
  onOpenProduct,
  onOrder,
}: MenuCatalogProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  if (categories.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Carta</p>
        <p className="mt-2 text-base font-semibold text-neutral-950">Esta carta todavía no tiene categorías visibles.</p>
        <p className="mt-2 max-w-xl leading-6">
          Cuando el negocio publique su menú, podrás recorrerlo por secciones.
        </p>
      </div>
    )
  }

  const navItems = categories.map((c) => ({ id: c.id, label: c.name }))

  function handleSelect(id: string) {
    setActiveId(id)
    document.getElementById(`menu-category-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-20 rounded-[1.5rem] border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Categorías</p>
            <p className="mt-1 text-sm text-neutral-600">Muévete entre secciones de la carta.</p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {categories.length} secciones
          </span>
        </div>
        <MenuCategoryNav items={navItems} activeId={activeId} onSelect={handleSelect} />
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
