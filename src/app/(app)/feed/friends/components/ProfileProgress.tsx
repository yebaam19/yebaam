'use client'

import { CheckCircleIcon } from '@/components/icons/heroicons-shim'
import { useAuth } from '@/features/auth/context/auth-context'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { cn } from '@/lib/utils'

interface Step {
  label: string
  done: boolean
}

function CircularProgress({ percent }: { percent: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-neutral-200 dark:text-neutral-700"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary-600 transition-[stroke-dashoffset] duration-500 dark:text-primary-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">
          {percent}%
        </span>
      </div>
    </div>
  )
}

export function ProfileProgress() {
  const { user } = useAuth()
  const { totalFriends } = useFriendships()

  const steps: Step[] = [
    { label: 'Foto de perfil', done: Boolean(user?.avatarUrl || user?.avatar) },
    {
      label: 'Información básica',
      done: Boolean(user?.firstName && user?.lastName && user?.residenceCity),
    },
    { label: 'Intereses', done: Boolean((user as any)?.interests?.length) },
    { label: 'Conecta 5 amigos', done: (totalFriends || 0) >= 5 },
    { label: 'Verificado', done: Boolean(user?.emailVerified) },
  ]

  const completed = steps.filter((s) => s.done).length
  const percent = Math.round((completed / steps.length) * 100)

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-4 sm:gap-6">
        <CircularProgress percent={percent} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">
                Tu progreso
              </h2>
              <p className="text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                Completa tu perfil y consigue más conexiones
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {completed} de {steps.length} completados
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-primary-500 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {steps.map((step, i) => (
              <li
                key={step.label}
                className={cn(
                  'flex items-center gap-1.5 text-xs sm:text-sm',
                  step.done
                    ? 'text-neutral-700 dark:text-neutral-200'
                    : 'text-neutral-400 dark:text-neutral-500',
                )}
              >
                {step.done ? (
                  <CheckCircleIcon className="size-4 text-primary-600 dark:text-primary-500" />
                ) : (
                  <span className="flex size-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-medium dark:border-neutral-600">
                    {i + 1}
                  </span>
                )}
                <span>{step.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
