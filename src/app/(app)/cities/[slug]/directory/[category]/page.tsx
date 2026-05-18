import { PortalUnderConstruction } from '@/features/cities/components/portal/PortalUnderConstruction'
import { PORTAL_SECTIONS } from '@/features/cities/data/portal-sections'

interface Props {
  params: Promise<{ slug: string; category: string }>
}

/**
 * Dynamic directory category page (Phase 5 will replace mocks here).
 *
 * For every directory subcategory tile (food, lodging, government, …) the
 * portal grid links to `/cities/<slug>/directory/<category>`. Until Phase 5
 * wires real business listings filtered by category, every request lands on
 * a polished under-construction state instead of a 404.
 *
 * The category id is matched against `PORTAL_SECTIONS` to render the
 * correct icon + label; an unknown category falls back to the generic
 * directory tile.
 */
export default async function DirectoryCategoryPage({ params }: Props) {
  const { slug, category } = await params
  const known = PORTAL_SECTIONS.find((s) => s.id === category)
  const sectionId = known?.id ?? 'directories'
  return <PortalUnderConstruction sectionId={sectionId} citySlug={slug} />
}
