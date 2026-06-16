'use client'

import { usePostStore } from '@/app/(app)/feed/post/stores/post.store'

interface Props {
  businessId: string
  businessName: string
  businessSlug: string
}

export function CreateBusinessPostButton({ businessId, businessName, businessSlug }: Props) {
  const openCreateModal = usePostStore((s) => s.openCreateModal)

  return (
    <button
      type="button"
      onClick={() => openCreateModal(undefined, undefined, businessId, businessName, businessSlug)}
      className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 active:scale-95"
    >
      <span className="text-base leading-none">+</span>
      Nueva publicación
    </button>
  )
}
