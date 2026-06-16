import { FaCircleCheck } from 'react-icons/fa6'

interface VerifiedBadgeProps {
  className?: string
}

export default function VerifiedBadge({ className = '' }: VerifiedBadgeProps) {
  return (
    <span
      className={[
        'inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-sky-200',
        className,
      ].join(' ')}
      title="Perfil verificado"
      aria-label="Perfil verificado"
    >
      <FaCircleCheck className="h-4 w-4" />
    </span>
  )
}
