import { CityMenu } from '@/features/cities/components/CityMenu'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

/**
 * City Portal layout.
 *
 * Phase 2 dropped the desktop sidebar — the shortcut tile grid (business
 * directory categories + city history, see `PORTAL_SHORTCUTS`) IS the
 * desktop nav. `CityMenu` is rendered unconditionally; its own internal
 * wrapper restricts it to `< lg` (mobile FAB only).
 */
export default async function CityLayout({ children, params }: Props) {
  const { slug } = await params

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="min-w-0">{children}</div>
      <CityMenu citySlug={slug} />
    </div>
  )
}
