import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProgramById } from '@/features/escuelas/server/program.server'
import { ProgramDetail } from '@/features/escuelas/components/public/ProgramDetail'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const program = await getProgramById(id)
  if (!program) return {}
  return { title: `${program.name} | Yebaam Escuelas` }
}

export default async function ProgramaPage({ params }: Props) {
  const { id } = await params
  const program = await getProgramById(id)
  if (!program) notFound()

  return <ProgramDetail program={program} />
}
