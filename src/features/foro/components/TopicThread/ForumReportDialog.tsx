'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { reportCommunityForumPost } from '../../actions/reports.actions'

export function ForumReportDialog({ postId, onClose }: { postId: string; onClose: () => void }) {
  const t = useTranslations('foro.reports')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await reportCommunityForumPost(postId, reason)
      if (result.ok) setSubmitted(true)
      else setError(result.error)
    })
  }

  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }}
    aria-labelledby="forum-report-title"
    className="m-auto w-[min(28rem,calc(100vw-1.5rem))] rounded-2xl border border-primary-100 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-primary-900 dark:bg-neutral-900 dark:text-neutral-100">
    <div className="border-b border-primary-100 px-4 py-3 dark:border-primary-900/50">
      <h2 id="forum-report-title" className="text-base font-semibold text-primary-900 dark:text-primary-100">{t('title')}</h2>
      <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{t('description')}</p>
    </div>
    {submitted ? <div className="space-y-3 px-4 py-4">
      <p role="status" className="text-sm text-primary-800 dark:text-primary-200">{t('received')}</p>
      <button type="button" onClick={onClose} className="min-h-11 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">{t('close')}</button>
    </div> : <form onSubmit={submit} className="space-y-3 px-4 py-4">
      <label htmlFor="forum-report-reason" className="block text-sm font-medium">{t('reason')}</label>
      <textarea id="forum-report-reason" value={reason} onChange={(event) => setReason(event.target.value)}
        minLength={10} maxLength={500} rows={4} required autoFocus placeholder={t('reasonPlaceholder')}
        className="w-full resize-y rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 dark:border-primary-800 dark:bg-neutral-800" />
      <p className="text-xs text-neutral-500">{t('length', { count: reason.length })}</p>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-200">{t('cancel')}</button>
        <button type="submit" disabled={pending || reason.trim().length < 10}
          className="min-h-11 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-50">
          {t(pending ? 'sending' : 'submit')}
        </button>
      </div>
    </form>}
  </dialog>
}
