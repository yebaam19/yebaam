import { ShieldCheck } from 'lucide-react'

interface VerifiedBadgeProps {
  className?: string
}

export function VerifiedBadge({ className = '' }: VerifiedBadgeProps) {
  return (
    <span
      className={[
        'inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-sky-200',
        className,
      ].join(' ')}
      title="Perfil verificado"
      aria-label="Perfil verificado"
    >
      <ShieldCheck size={14} aria-hidden="true" />
    </span>
  )
}
