import Image from 'next/image'
import type { Business, MenuWithCategories } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

interface Props {
  business: Business
  menus: MenuWithCategories[]
}

export function MenuView({ business, menus }: Props) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Menú — {business.name}</h1>

      {menus.length === 0 ? (
        <p className="text-muted-foreground">Sin menú disponible.</p>
      ) : (
        menus.map((menu) => (
          <section key={menu.id} className="mb-10">
            <h2 className="text-lg font-semibold mb-4">{menu.name}</h2>
            {menu.categories.map((cat) => (
              <div key={cat.id} className="mb-6">
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">{cat.name}</h3>
                <ul className="space-y-3">
                  {cat.products.map((product) => {
                    const imgUrl = cfImageUrl(product.cf_image_id)
                    return (
                      <li key={product.id} className="flex gap-3 border-b border-border pb-3">
                        {imgUrl && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={imgUrl} alt={product.name} fill className="object-cover" sizes="64px" unoptimized />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.short_description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.short_description}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold flex-shrink-0">
                          {product.currency} {product.price.toFixed(2)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  )
}
