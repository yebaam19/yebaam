import { notFound, redirect } from 'next/navigation'
import type { Route } from 'next'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getCityForumSpaceSlug } from '@/features/cities/server/forums.server'
import { PortalUnderConstruction } from '@/features/cities/components/portal/PortalUnderConstruction'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * Each city has a 1:1 `forum_spaces` row (owner_type='city'). This route is a
 * thin shim that resolves that space and 308-redirects to `/foro/<spaceSlug>`
 * — reusing the existing `/foro/[spaceSlug]` UI rather than duplicating it.
 *
 * Cities created before the auto-provisioning wiring landed may not have a
 * space yet (createCity now creates one). For those, we render the same
 * under-construction empty state the rest of the portal uses.
 */
export default async function CityForumsPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()

  const spaceSlug = await getCityForumSpaceSlug(city.id)
  if (spaceSlug) {
    redirect(`/foro/${spaceSlug}` as Route)
  }
  return <PortalUnderConstruction sectionId="forums" citySlug={slug} />
}
