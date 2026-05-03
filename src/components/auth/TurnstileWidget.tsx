'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { forwardRef, useImperativeHandle, useRef } from 'react'

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onExpire?: () => void
  onError?: (error: string) => void
  action?: string
  className?: string
}

export interface TurnstileWidgetHandle {
  reset: () => void
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onSuccess, onExpire, onError, action, className }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    const innerRef = useRef<TurnstileInstance | null>(null)

    useImperativeHandle(ref, () => ({
      reset: () => innerRef.current?.reset(),
    }))

    if (!siteKey) {
      if (process.env.NODE_ENV !== 'production') {
        return (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Turnstile site key no configurado (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
          </div>
        )
      }
      return null
    }

    return (
      <div className={className}>
        <Turnstile
          ref={innerRef}
          siteKey={siteKey}
          onSuccess={onSuccess}
          onExpire={onExpire}
          onError={(err) => onError?.(typeof err === 'string' ? err : 'Error CAPTCHA')}
          options={{
            action,
            theme: 'light',
            size: 'flexible',
          }}
        />
      </div>
    )
  },
)
