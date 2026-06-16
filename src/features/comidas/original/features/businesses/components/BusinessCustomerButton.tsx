import { useEffect, useState } from 'react'
import { FaUserTie, FaCheck } from 'react-icons/fa6'
import { isAuthenticated } from '../../../lib/session'
import { toggleBusinessCustomer } from '../api'
import { getErrorMessage } from '../../../lib/httpError'

interface BusinessCustomerButtonProps {
  businessId: number
  businessName: string
  initialIsCustomer?: boolean
  initialCustomersCount?: number
  onRequireAuth?: () => void
  onStateChange?: (isCustomer: boolean, customersCount: number) => void
  className?: string
}

export default function BusinessCustomerButton({
  businessId,
  businessName,
  initialIsCustomer = false,
  initialCustomersCount = 0,
  onRequireAuth,
  onStateChange,
  className = '',
}: BusinessCustomerButtonProps) {
  const [isCustomer, setIsCustomer] = useState(initialIsCustomer)
  const [customersCount, setCustomersCount] = useState(initialCustomersCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsCustomer(initialIsCustomer)
    setCustomersCount(initialCustomersCount)
    setError('')
  }, [businessId, initialIsCustomer, initialCustomersCount])

  async function handleToggle() {
    if (!isAuthenticated()) {
      onRequireAuth?.()
      return
    }

    if (loading) return

    const previousIsCustomer = isCustomer
    const previousCustomersCount = customersCount
    const nextIsCustomer = !previousIsCustomer
    const nextCustomersCount = Math.max(
      0,
      previousCustomersCount + (nextIsCustomer ? 1 : -1)
    )

    setLoading(true)
    setError('')
    setIsCustomer(nextIsCustomer)
    setCustomersCount(nextCustomersCount)

    try {
      const result = await toggleBusinessCustomer(businessId)
      setIsCustomer(result.isCustomer)
      setCustomersCount(result.customersCount)
      onStateChange?.(result.isCustomer, result.customersCount)
    } catch (err: unknown) {
      setIsCustomer(previousIsCustomer)
      setCustomersCount(previousCustomersCount)
      setError(getErrorMessage(err, 'No pudimos actualizar tu relación con el negocio.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <button
        type="button"
        onClick={() => {
          void handleToggle()
        }}
        aria-pressed={isCustomer}
        aria-label={
          isCustomer
            ? `Quitar ${businessName} de mis negocios`
            : `Marcar ${businessName} como negocio frecuente`
        }
        title={isCustomer ? 'Negocio frecuente' : 'Marcar como frecuente'}
        disabled={loading}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(15,95,47,0.18)] focus:ring-offset-2',
          loading ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-px hover:shadow',
          isCustomer
            ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <span
          className={[
            'inline-flex h-4 w-4 items-center justify-center',
            isCustomer ? 'text-green-600' : 'text-slate-500',
          ].join(' ')}
        >
          {isCustomer ? <FaCheck /> : <FaUserTie />}
        </span>
        <span>{isCustomer ? 'Frecuente' : 'Soy cliente'}</span>
      </button>
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
