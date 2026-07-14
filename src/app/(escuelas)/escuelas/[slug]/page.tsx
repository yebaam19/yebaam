import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSchoolBySlug, checkSchoolAdmin } from '@/features/escuelas/server/school.server'
import { getServerClient } from '@/utils/supabase/server'
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

  const client = await getServerClient()
  const { data: { user } } = await client.auth.getUser()

  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  // Primary check: school_admins table (covers co-admins).
  // Fallback: created_by field — covers the case where school_admins row is
  // missing due to a partial migration, without opening a security hole
  // (created_by is set by the DB-side SECURITY DEFINER function, not by the client).
  const isAdminByRole = user ? await checkSchoolAdmin(school.id) : false
  const isAdminByCreation = !!user && user.id === school.created_by
  const isAdmin = isAdminByRole || isAdminByCreation

  return <SchoolDetail school={school} isAdmin={isAdmin} />
}
