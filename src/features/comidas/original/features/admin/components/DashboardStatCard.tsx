import Card, { CardContent } from '../../../components/ui/Card'

interface DashboardStatCardProps {
  label: string
  value: string | number
  hint?: string
  trend?: string
}

export default function DashboardStatCard({
  label,
  value,
  hint,
  trend,
}: DashboardStatCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>

        {(hint || trend) && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {trend && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">
                {trend}
              </span>
            )}
            {hint && <span className="text-slate-500">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}