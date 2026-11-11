'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { uploadService } from '@/lib/service/upload.service'
import { cfImageUrl } from '@/lib/cloudflare'
import { DIRECTORY_STATUSES, type DirectoryEntry, type DirectoryStatus } from '@/features/cities/directory/types'
import { saveCityDirectoryEntry } from '@/features/admin/actions/city-directory.actions'
import { primaryActionStyles } from '@/ui/primary-action-styles'

interface Props {
  cityId: string
  category: string
  entry?: DirectoryEntry
  onClose?: () => void
}

export function DirectoryEntryForm({ cityId, category, entry, onClose }: Props) {
  const t = useTranslations('admin.cityDirectory')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [image, setImage] = useState(entry?.cover_cf_image_id ?? null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // Allocate on first submission, retaining the same id after a failed request.
  const [draftId, setDraftId] = useState(entry?.id ?? '')
  const busy = pending || uploading
  const preview = cfImageUrl(image)

  async function upload(file: File) {
    setError('')
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setError(t('imageError'))
      return
    }
    setUploading(true)
    try {
      const result = await uploadService.uploadImage(file, undefined, { source: 'city-directory' })
      setImage(result.id)
    } catch { setError(t('uploadError')) }
    finally { setUploading(false) }
  }

  function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    const status = String(data.get('status')) as DirectoryStatus
    if (status === 'archived' && entry?.status !== 'archived' && !window.confirm(t('archiveConfirm'))) return
    const id = draftId || crypto.randomUUID()
    setDraftId(id)
    setError('')
    setNotice('')
    startTransition(async () => {
      try {
        const result = await saveCityDirectoryEntry({
          id, city_id: cityId, category, status, cover_cf_image_id: image,
          name: String(data.get('name') ?? ''), description: String(data.get('description') ?? ''),
          address: String(data.get('address') ?? ''), phone: String(data.get('phone') ?? ''),
          website: String(data.get('website') ?? ''),
        })
        if (!result.ok) { setError(t('saveError')); return }
        router.refresh()
        if (entry) onClose?.()
        else {
          form.reset()
          setImage(null)
          setDraftId('')
          setNotice(t('saved'))
        }
      } catch { setError(t('saveError')) }
    })
  }

  const fieldClass = 'mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900'
  return (
    <form onSubmit={(event) => { event.preventDefault(); submit(event.currentTarget) }} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-medium">{t('name')}
          <input name="name" required maxLength={150} defaultValue={entry?.name} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">{t('description')}
          <textarea name="description" rows={3} maxLength={4000} defaultValue={entry?.description} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">{t('address')}
          <input name="address" maxLength={500} defaultValue={entry?.address} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">{t('phone')}
          <input name="phone" type="tel" maxLength={40} defaultValue={entry?.phone} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">{t('website')}
          <input name="website" type="url" maxLength={2048} placeholder="https://" defaultValue={entry?.website} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">{t('photo')}
          <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
            e.target.value = ''
          }} />
        </label>
        {preview && <div className="flex items-center gap-3">
          <Image src={preview} alt="" width={128} height={80} unoptimized className="h-20 w-32 rounded-lg object-cover" />
          <button type="button" onClick={() => setImage(null)} className="text-sm underline">{t('removePhoto')}</button>
        </div>}
        <label className="block text-sm font-medium">{t('status')}
          <select name="status" defaultValue={entry?.status ?? 'draft'} className={fieldClass}>
            {DIRECTORY_STATUSES.map((status) => <option key={status} value={status}>{t(status)}</option>)}
          </select>
        </label>
        <p className="text-xs text-neutral-500">{t('visibilityHint')}</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={`${primaryActionStyles} px-4`}>{pending ? t('saving') : t('save')}</button>
          {onClose && <button type="button" onClick={onClose} className="px-3 text-sm underline">{t('cancel')}</button>}
        </div>
      </fieldset>
      {uploading && <p role="status" className="text-sm">{t('uploading')}</p>}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && <p role="status" className="text-sm text-primary-700 dark:text-primary-300">{notice}</p>}
    </form>
  )
}

export function DirectoryEntryEditor(props: Props & { entry: DirectoryEntry }) {
  const [editing, setEditing] = useState(false)
  const t = useTranslations('admin.cityDirectory')
  return <li className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><h3 className="break-words font-semibold">{props.entry.name}</h3>
        <p className="text-xs text-neutral-500">{t(props.entry.status)}</p></div>
      {!editing && <button type="button" className="min-h-10 px-3 text-sm underline" onClick={() => setEditing(true)}>{t('edit')}</button>}
    </div>
    {editing && <div className="mt-4"><DirectoryEntryForm {...props} onClose={() => setEditing(false)} /></div>}
  </li>
}
