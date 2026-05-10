'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { occupationLabel } from '@/features/auth/constants/occupations';
import { colorForSlug } from './occupation-colors';
import type { OccupationDistributionRow } from '@/features/admin/server/occupation-stats.server';

interface Props {
  data: OccupationDistributionRow[];
}

export function OccupationDistributionChart({ data }: Props) {
  const rows = data
    .filter((r) => r.slug !== null)
    .map((r) => ({
      slug: r.slug as string,
      label: occupationLabel(r.slug),
      total: r.total,
    }))
    .sort((a, b) => b.total - a.total);

  const unknown = data.find((r) => r.slug === null);
  if (unknown && unknown.total > 0) {
    rows.push({ slug: 'unknown', label: 'Sin especificar', total: unknown.total });
  }

  if (rows.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-neutral-500">
        Aún no hay datos de ocupación.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, rows.length * 32 + 60)}>
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
          formatter={(value) => [Number(value), 'Usuarios']}
        />
        <Bar dataKey="total" radius={[0, 6, 6, 0]}>
          {rows.map((r) => (
            <Cell key={r.slug} fill={colorForSlug(r.slug === 'unknown' ? null : r.slug)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
