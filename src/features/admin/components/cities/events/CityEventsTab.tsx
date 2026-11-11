import Link from 'next/link'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { getCityEvents } from '@/features/cities/server/events.server'
import { Pagination } from '../editor/Pagination'
import { CityEventEditor, CityEventForm } from './CityEventForm'

export async function CityEventsTab({ city, page }: { city: AdminCityDetail; page: number }) {
  const result = await getCityEvents(city.id, page, true)
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  return <section className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Eventos ({result.total})</h2><Link href={`/cities/${city.slug}/events`}>Ver calendario público</Link></header>
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div>{result.items.length ? <ul className="space-y-3">{result.items.map((event) => <CityEventEditor key={`${event.id}-${event.status}`} event={event} />)}</ul> : <p className="rounded-xl border border-dashed p-6 text-sm">Todavía no hay eventos en esta ciudad.</p>}
        {totalPages > 1 && <Pagination baseHref={`/admin/ciudades/${city.slug}?tab=events`} page={result.page} totalPages={totalPages} previousLabel="Anterior" nextLabel="Siguiente" pageOfLabel={`${result.page} de ${totalPages}`} />}
      </div>
      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"><h3 className="mb-4 font-semibold">Agregar evento</h3><CityEventForm cityId={city.id} /></section>
    </div>
  </section>
}
