import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { getDirectoryCategories, getDirectoryEntries } from '@/features/cities/server/directory-entries.server'
import { DirectoryEntryEditor, DirectoryEntryForm } from './DirectoryEntryForm'
import { Pagination } from '../editor/Pagination'

export async function CityDirectoryTab({ city, category, page }: { city: AdminCityDetail; category: string; page: number }) {
  const t = await getTranslations('admin.cityDirectory')
  const sectionsT = await getTranslations('cities.portal.sections')
  const categories = await getDirectoryCategories()
  const selected = categories.find((c) => c.slug === category) ?? categories[0]
  if (!selected) return <p role="alert">{t('categoriesError')}</p>
  const result = await getDirectoryEntries(city.id, selected.slug, page, true)
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const baseHref = `/admin/ciudades/${city.slug}?tab=directory&category=${selected.slug}`
  return <section className="space-y-5">
    <header><h2 className="text-xl font-semibold">{t('heading')}</h2>
      <p className="mt-1 text-sm text-neutral-500">{t('hint')}</p></header>
    <nav aria-label={t('category')} className="flex flex-wrap gap-2">
      {categories.map((c) => <Link key={c.id} href={`/admin/ciudades/${city.slug}?tab=directory&category=${c.slug}` as `/${string}`}
        aria-current={selected.id === c.id ? 'page' : undefined}
        className={`rounded-full border px-3 py-2 text-sm ${selected.id === c.id ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300 dark:border-neutral-700'}`}>
        {sectionsT(`${c.slug}.label`)}
      </Link>)}
    </nav>
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold">{sectionsT(`${selected.slug}.label`)} ({result.total})</h3>
          <Link href={`/cities/${city.slug}/directory/${selected.slug}` as `/${string}`} target="_blank" rel="noopener noreferrer" className="text-sm underline">{t('viewPublic')}</Link>
        </div>
        {result.items.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-neutral-500">{t('empty')}</p> :
          <ul className="space-y-3">{result.items.map((entry) => <DirectoryEntryEditor key={`${entry.id}-${entry.status}`} entry={entry} cityId={city.id} category={selected.slug} />)}</ul>}
        {totalPages > 1 && <Pagination baseHref={baseHref} page={result.page} totalPages={totalPages}
          previousLabel={t('previous')} nextLabel={t('next')} pageOfLabel={t('pageOf', { page: result.page, totalPages })} />}
      </section>
      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-4 font-semibold">{t('add')}</h3>
        <DirectoryEntryForm key={selected.slug} cityId={city.id} category={selected.slug} />
      </section>
    </div>
  </section>
}
