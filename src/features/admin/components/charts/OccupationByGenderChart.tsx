'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { OCCUPATIONS, occupationLabel } from '@/features/auth/constants/occupations';
import type { OccupationByGenderRow } from '@/features/admin/server/occupation-stats.server';

const GENDER_LABEL: Record<string, string> = {
  FEMALE: 'Mujer',
  MALE: 'Hombre',
  OTHER: 'Otro',
};

const GENDER_COLOR: Record<string, string> = {
  FEMALE: '#ec4899',
  MALE: '#3b82f6',
  OTHER: '#a855f7',
  UNKNOWN: '#cbd5e1',
};

interface Props {
  data: OccupationByGenderRow[];
}

export function OccupationByGenderChart({ data }: Props) {
  type Bucket = { occupation: string; label: string; total: number; [gender: string]: string | number };
  const byOccupation = new Map<string, Bucket>();
  for (const { slug } of OCCUPATIONS) {
    byOccupation.set(slug, {
      occupation: slug,
      label: occupationLabel(slug),
      total: 0,
      FEMALE: 0,
      MALE: 0,
      OTHER: 0,
      UNKNOWN: 0,
    });
  }
  for (const row of data) {
    if (!row.slug) continue;
    const bucket = byOccupation.get(row.slug);
    if (!bucket) continue;
    const key = (row.gender ?? 'UNKNOWN').toUpperCase();
    const safeKey = ['FEMALE', 'MALE', 'OTHER'].includes(key) ? key : 'UNKNOWN';
    bucket[safeKey] = ((bucket[safeKey] as number | undefined) ?? 0) + row.total;
    bucket.total += row.total;
  }
  const rows = Array.from(byOccupation.values())
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  if (rows.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-neutral-500">
        Aún no hay datos por género.
      </p>
    );
  }

  const activeGenders = (['FEMALE', 'MALE', 'OTHER', 'UNKNOWN'] as const).filter((g) =>
    rows.some((r) => ((r[g] as number | undefined) ?? 0) > 0),
  );

  return (
    <ResponsiveContainer width="100%" height={Math.max(320, rows.length * 36 + 80)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={170}
          tick={{ fill: '#374151', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(value, name) => [Number(value), GENDER_LABEL[String(name)] ?? 'Otro']}
        />
        <Legend
          formatter={(value: string) => GENDER_LABEL[value] ?? value}
          wrapperStyle={{ fontSize: 12 }}
        />
        {activeGenders.map((g) => (
          <Bar key={g} dataKey={g} stackId="gender" fill={GENDER_COLOR[g]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
