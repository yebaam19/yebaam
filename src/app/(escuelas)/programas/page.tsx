import type { Metadata } from 'next'
import { listPrograms } from '@/features/escuelas/server/program.server'
import { ProgramCard } from '@/features/escuelas/components/public/ProgramCard'
import type { ProgramFilters } from '@/features/escuelas/types'

export const metadata: Metadata = {
  title: 'Programas | Yebaam Escuelas',
  description: 'Cursos, talleres y programas artísticos.',
}

interface Props {
  searchParams: Promise<{ modality?: string; level?: string; q?: string; page?: string }>
}

export default async function ProgramasPage({ searchParams }: Props) {
  const params = await searchParams
  const filters: ProgramFilters = {
    modality: params.modality as ProgramFilters['modality'],
    level: params.level as ProgramFilters['level'],
    search: params.q,
    page: params.page ? Number(params.page) : 1,
    limit: 24,
  }

  const { data: programs, count } = await listPrograms(filters)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Programas</h1>
      {programs.length === 0 ? (
        <p className="text-muted-foreground">No se encontraron programas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      )}
    </main>
  )
}
