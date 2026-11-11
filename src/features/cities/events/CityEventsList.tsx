import Image from 'next/image'
import { cfImageUrl } from '@/lib/cloudflare'
import { getCityEvents } from '../server/events.server'
import { formatEventDate } from './types'
import { Pagination } from '@/features/admin/components/cities/editor/Pagination'

export async function CityEventsList({ cityId, citySlug, cityName, page }: { cityId: string; citySlug: string; cityName: string; page: number }) {
  const result = await getCityEvents(cityId, page)
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  return <section className="space-y-6">
    <header><h1 className="text-2xl font-bold">Eventos en {cityName}</h1><p className="mt-2 text-sm text-neutral-500">Actividades en curso y próximas. Cada horario se muestra en la zona del evento.</p></header>
    {result.items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-neutral-500">No hay eventos publicados para estas fechas.</p> :
      <ul className="grid gap-5 sm:grid-cols-2">{result.items.map((event) => {
        const image = cfImageUrl(event.cover_cf_image_id)
        return <li key={event.id} className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          {image && <Image src={image} alt="" width={640} height={360} unoptimized className="aspect-video w-full object-cover" />}
          <article className="space-y-3 p-5"><h2 className="text-xl font-semibold">{event.title}</h2>
            <p className="text-sm"><time dateTime={event.starts_at}>{formatEventDate(event, 'starts_at')}</time> — <time dateTime={event.ends_at}>{formatEventDate(event, 'ends_at')}</time><br /><span className="text-neutral-500">{event.time_zone}</span></p>
            <p className="text-sm font-medium">{event.venue}</p><p className="whitespace-pre-wrap break-words text-sm">{event.description}</p>
            {event.website && <a href={event.website} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary-700 underline dark:text-primary-300">Más información (sitio externo)</a>}
          </article>
        </li>
      })}</ul>}
    {totalPages > 1 && <Pagination baseHref={`/cities/${citySlug}/events?view=upcoming`} page={result.page} totalPages={totalPages} previousLabel="Anterior" nextLabel="Siguiente" pageOfLabel={`${result.page} de ${totalPages}`} />}
  </section>
}
