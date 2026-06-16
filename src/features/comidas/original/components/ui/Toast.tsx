import React from 'react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  open: boolean
  message: string
  title?: string
  variant?: ToastVariant
  onClose?: () => void
  duration?: number
}

const styles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

const icons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
}

export function Toast({
  open,
  message,
  title,
  variant = 'info',
  onClose,
  duration = 3500,
}: ToastProps) {
  React.useEffect(() => {
    if (!open || !onClose) return

    const timer = window.setTimeout(() => {
      onClose()
    }, duration)

    return () => window.clearTimeout(timer)
  }, [open, onClose, duration])

  if (!open) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] w-full max-w-sm">
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-lg ${styles[variant]}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 font-bold">
          {icons[variant]}
        </div>

        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold">{title}</p>}
          <p className="text-sm">{message}</p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-current/70 transition hover:bg-white/40 hover:text-current"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default Toast