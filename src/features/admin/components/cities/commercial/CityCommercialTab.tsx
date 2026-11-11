import Link from 'next/link'
import type { Route } from 'next'
import { listCityCommercial } from '@/features/admin/server/cities/commercial.server'
import type { CommercialKind } from '@/features/admin/lib/city-commercial'
import { CityCommercialForm } from './CityCommercialForm'

export async function CityCommercialTab({ city, kind, page = 1 }: {
  city: { id: string; slug: string }; kind: CommercialKind; page?: number
}) {
  const { items, total, categories } = await listCityCommercial(city.id, kind, page)
  const title = kind === 'businesses' ? 'Negocios' : 'Servicios profesionales'
  const safePage = Math.max(1, Math.floor(page || 1))
  const tab = kind === 'businesses' ? 'businesses' : 'services'
  return <div className="grid gap-6 lg:grid-cols-2">
    <section className="space-y-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="text-lg font-semibold">{title} ({total})</h2>
      {items.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay registros en esta ciudad.</p>}
      {items.map((entry) => <details key={entry.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <summary className="cursor-pointer font-medium">{entry.name} · {kind === 'businesses' ? entry.is_active ? 'Publicado' : 'Borrador' : entry.visibility === 'PUBLIC' ? 'Público' : 'Privado'}</summary>
        <div className="mt-4 space-y-4">
          {(kind === 'services' || entry.is_active) && <Link className="text-sm text-primary-700 underline" href={(kind === 'businesses' ? `/negocios/${entry.slug}` : `/professional-services/${entry.slug}`) as Route}>Abrir perfil</Link>}
          {kind === 'businesses' && <p><Link className="text-sm text-primary-700 underline" href={`/negocios/admin/${entry.id}/settings` as Route}>Más opciones, imágenes y productos (administradores del negocio)</Link></p>}
          {kind === 'services' && entry.admin_draft && !entry.provider_declaration_accepted_at && <p className="text-sm text-amber-700">Pendiente de aceptación del prestador. Comparte con él el enlace «Abrir perfil»; solo su cuenta puede aceptar.</p>}
          <CityCommercialForm cityId={city.id} kind={kind} categories={categories} entry={entry} />
        </div>
      </details>)}
      <nav aria-label={`Paginación de ${title}`} className="flex gap-4 text-sm">
        {safePage > 1 && <Link href={`/admin/ciudades/${city.slug}?tab=${tab}&page=${safePage - 1}` as Route}>Anterior</Link>}
        <span>Página {safePage} de {Math.max(1, Math.ceil(total / 24))}</span>
        {safePage * 24 < total && <Link href={`/admin/ciudades/${city.slug}?tab=${tab}&page=${safePage + 1}` as Route}>Siguiente</Link>}
      </nav>
    </section>
    <section className="space-y-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="text-lg font-semibold">Agregar {kind === 'businesses' ? 'negocio' : 'servicio profesional'}</h2>
      <CityCommercialForm cityId={city.id} kind={kind} categories={categories} />
    </section>
  </div>
}
