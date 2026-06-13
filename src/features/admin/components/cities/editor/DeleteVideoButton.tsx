'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { deleteCityVideo } from '@/features/admin/actions/city-media.actions'

export function DeleteVideoButton({ videoId }: { videoId: string }) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const onClick = () => {
    if (!confirm(t('videoDeleteConfirm'))) return
    startTransition(async () => {
      const res = await deleteCityVideo({ videoId })
      if (res.ok) router.refresh()
    })
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      aria-label={t('removeCta')}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 disabled:opacity-50"
    >
      <XMarkIcon className="h-4 w-4" />
    </button>
  )
}
