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
import { colorForSlug } from './occupation-colors';
import type { OccupationByDepartmentRow } from '@/features/admin/server/occupation-stats.server';

interface Props {
  data: OccupationByDepartmentRow[];
  topN?: number;
}

export function OccupationByDepartmentChart({ data, topN = 10 }: Props) {
  type Bucket = { department: string; total: number; [slug: string]: string | number };
  const byDept = new Map<string, Bucket>();
  for (const row of data) {
    const dept = row.department || 'Sin especificar';
    const slug = row.slug ?? 'unknown';
    const bucket = byDept.get(dept) ?? ({ department: dept, total: 0 } as Bucket);
    bucket[slug] = ((bucket[slug] as number | undefined) ?? 0) + row.total;
    bucket.total += row.total;
    byDept.set(dept, bucket);
  }
  const rows = Array.from(byDept.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);

  if (rows.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-neutral-500">
        Aún no hay datos por departamento.
      </p>
    );
  }

  const activeSlugs = OCCUPATIONS.filter(({ slug }) => rows.some((r) => ((r[slug] as number | undefined) ?? 0) > 0));

  return (
    <ResponsiveContainer width="100%" height={Math.max(320, rows.length * 36 + 80)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="department"
          width={180}
          tick={{ fill: '#374151', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(value, name) => [Number(value), occupationLabel(String(name))]}
        />
        <Legend
          formatter={(value: string) => occupationLabel(value)}
          wrapperStyle={{ fontSize: 12 }}
        />
        {activeSlugs.map(({ slug }) => (
          <Bar key={slug} dataKey={slug} stackId="dept" fill={colorForSlug(slug)} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
