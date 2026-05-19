'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  grantCityAdmin,
  lookupUserByUsername,
} from '@/features/admin/actions/cities.actions'

interface Props {
  cityId: string
}

type Role = 'owner' | 'franchise' | 'contractor'

export function AddAdminForm({ cityId }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<Role>('contractor')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const lookup = await lookupUserByUsername(username)
      if (!lookup.ok) {
        setError(lookup.error === 'not_found' ? t('addAdminUserNotFound') : t('actionError'))
        return
      }
      const grant = await grantCityAdmin({
        cityId,
        userId: lookup.data.id,
        role,
      })
      if (!grant.ok) {
        setError(
          grant.error === 'already_granted' ? t('adminAlreadyGranted') : t('actionError'),
        )
        return
      }
      setUsername('')
      setRole('contractor')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          @{t('addAdminUsernamePlaceholder').replace('@', '')}
        </label>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('addAdminUsernamePlaceholder')}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t('addAdminRoleLabel')}
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="owner">{t('adminRoleOwner')}</option>
          <option value="franchise">{t('adminRoleFranchise')}</option>
          <option value="contractor">{t('adminRoleContractor')}</option>
        </select>
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !username.trim()}
        className="w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
      >
        {t('addAdminCta')}
      </button>
    </form>
  )
}
