import { CityMenu } from '@/features/cities/components/CityMenu'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

/**
 * City Portal layout.
 *
 * The shortcut grid is the desktop navigation. `CityMenu` is rendered
 * unconditionally; its own internal
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
