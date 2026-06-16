import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSchoolBySlug } from '@/features/escuelas/server/school.server'
import { SchoolDetail } from '@/features/escuelas/components/public/SchoolDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) return {}
  return {
    title: `${school.name} | Yebaam Escuelas`,
    description: school.description,
  }
}

export default async function SchoolPage({ params }: Props) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  return <SchoolDetail school={school} />
}
