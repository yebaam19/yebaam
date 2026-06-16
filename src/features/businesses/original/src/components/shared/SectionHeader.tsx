import Button from '../ui/Button'

export interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  align?: 'left' | 'center'
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  align = 'left',
}: SectionHeaderProps) {
  const centered = align === 'center'

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
        centered ? 'text-center sm:flex-col sm:items-center' : ''
      }`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
            {eyebrow}
          </p>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <div className={centered ? 'pt-2' : ''}>
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
