import type { Metadata } from 'next'
import { listSchools } from '@/features/escuelas/server/school.server'
import { EscuelasList } from '@/features/escuelas/components/public/EscuelasList'

export const metadata: Metadata = {
  title: 'Escuelas de Artes | Yebaam',
  description: 'Encuentra escuelas de música, danza, teatro y más.',
}

export default async function EscuelasPage() {
  const { data: schools, count } = await listSchools({ limit: 100 })

  return <EscuelasList schools={schools} totalCount={count ?? schools.length} />
}
