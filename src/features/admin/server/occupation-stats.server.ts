import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { OCCUPATIONS, type OccupationSlug } from '@/features/auth/constants/occupations';

export interface OccupationDistributionRow {
  slug: OccupationSlug | null;
  total: number;
}

export interface OccupationByDepartmentRow {
  slug: OccupationSlug | null;
  department: string | null;
  total: number;
}

export interface OccupationByGenderRow {
  slug: OccupationSlug | null;
  gender: string | null;
  total: number;
}

function normalizeSlug(raw: string | null): OccupationSlug | null {
  if (!raw) return null;
  return (OCCUPATIONS.find((o) => o.slug === raw)?.slug ?? null);
}

export const getOccupationDistribution = cache(async (): Promise<OccupationDistributionRow[]> => {
  const client = await getServerClient();
  const { data, error } = await client.rpc('admin_occupation_distribution');
  if (error || !data) return [];
  return (data as Array<{ occupation: string | null; total: number | string }>).map((r) => ({
    slug: normalizeSlug(r.occupation),
    total: Number(r.total),
  }));
});

export const getOccupationByDepartment = cache(async (): Promise<OccupationByDepartmentRow[]> => {
  const client = await getServerClient();
  const { data, error } = await client.rpc('admin_occupation_by_department');
  if (error || !data) return [];
  return (data as Array<{ occupation: string | null; department: string | null; total: number | string }>).map((r) => ({
    slug: normalizeSlug(r.occupation),
    department: r.department,
    total: Number(r.total),
  }));
});

export const getOccupationByGender = cache(async (): Promise<OccupationByGenderRow[]> => {
  const client = await getServerClient();
  const { data, error } = await client.rpc('admin_occupation_by_gender');
  if (error || !data) return [];
  return (data as Array<{ occupation: string | null; gender: string | null; total: number | string }>).map((r) => ({
    slug: normalizeSlug(r.occupation),
    gender: r.gender,
    total: Number(r.total),
  }));
});
