'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  listCommunityForumReports, reviewCommunityForumReport,
  type ForumReport, type ForumReportCursor, type ForumReportStatus,
} from '../actions/reports.actions'

export function ForumReportsEntry({ communityId }: { communityId: string }) {
  const t = useTranslations('foro.reports')
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }
  return <>
    <button ref={triggerRef} type="button" onClick={() => setOpen(true)}
      className="min-h-11 rounded-lg border border-primary-200 px-4 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-primary-800 dark:text-primary-200 dark:hover:bg-primary-950/30">
      {t('reviewReports')}
    </button>
    {open && <ForumReportsPanel communityId={communityId} onClose={close} />}
  </>
}

function ForumReportsPanel({ communityId, onClose }: { communityId: string; onClose: () => void }) {
  const t = useTranslations('foro.reports')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const activeStatus = useRef<ForumReportStatus>('open')
  const [status, setStatus] = useState<ForumReportStatus>('open')
  const [items, setItems] = useState<ForumReport[]>([])
  const [cursor, setCursor] = useState<ForumReportCursor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selection, setSelection] = useState<{ report: ForumReport; decision: 'remove' | 'dismiss' } | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  useEffect(() => {
    let active = true
    void listCommunityForumReports(communityId, status).then((result) => {
      if (!active) return
      if (result.ok) { setItems(result.items); setCursor(result.nextCursor); setError(null) }
      else setError(result.error)
      setLoading(false)
    })
    return () => { active = false }
  }, [communityId, status])

  const switchStatus = (next: ForumReportStatus) => {
    if (next === status) return
    activeStatus.current = next
    setStatus(next)
    setLoading(true)
    setItems([])
    setCursor(null)
    setSelection(null)
  }

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    const requestedStatus = status
    setLoadingMore(true)
    const result = await listCommunityForumReports(communityId, status, cursor)
    if (activeStatus.current === requestedStatus) {
      if (result.ok) {
        setItems((previous) => [...previous, ...result.items.filter((item) => !previous.some((row) => row.id === item.id))])
        setCursor(result.nextCursor)
      } else setError(result.error)
    }
    setLoadingMore(false)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selection || pending) return
    setError(null)
    startTransition(async () => {
      const result = await reviewCommunityForumReport(selection.report.id, selection.decision, note)
      if (!result.ok) { setError(result.error); return }
      setSelection(null)
      setNote('')
      const refreshed = await listCommunityForumReports(communityId, status)
      if (refreshed.ok) { setItems(refreshed.items); setCursor(refreshed.nextCursor) }
      else setError(refreshed.error)
    })
  }

  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }}
    aria-labelledby="forum-reports-title"
    className="m-auto max-h-[min(85dvh,700px)] w-[min(38rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-primary-100 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-primary-900 dark:bg-neutral-900 dark:text-neutral-100">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-primary-100 bg-white px-4 py-3 dark:border-primary-900 dark:bg-neutral-900">
      <div><h2 id="forum-reports-title" className="text-base font-semibold text-primary-900 dark:text-primary-100">{t('queueTitle')}</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">{t('queueDescription')}</p></div>
      <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-primary-200 px-3 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">{t('close')}</button>
    </div>
    <div className="flex gap-1 overflow-x-auto border-b border-primary-100 px-4 py-2 dark:border-primary-900">
      {(['open', 'resolved', 'dismissed'] as const).map((value) => <button key={value} type="button"
        onClick={() => switchStatus(value)} aria-pressed={status === value}
        className={status === value ? 'min-h-11 rounded-full bg-primary-800 px-3 text-xs font-semibold text-white' : 'min-h-11 rounded-full px-3 text-xs font-medium text-primary-800 hover:bg-primary-50 dark:text-primary-200'}>
        {t(`status.${value}`)}
      </button>)}
    </div>
    <div className="space-y-3 p-4">
      {loading && <p role="status" className="text-sm text-neutral-500">{t('loading')}</p>}
      {!loading && items.length === 0 && <p className="rounded-xl bg-primary-50 px-3 py-4 text-sm text-primary-800 dark:bg-primary-950/30 dark:text-primary-200">{t('empty')}</p>}
      {items.map((report) => <article key={report.id} className="rounded-xl border border-primary-100 p-3 dark:border-primary-900/60">
        <p className="text-xs text-neutral-500"><time dateTime={report.created_at}>{new Date(report.created_at).toLocaleString()}</time> · {report.topic_title}</p>
        <p className="mt-1 text-sm font-medium text-primary-950 dark:text-primary-100">{report.reason}</p>
        <p className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-primary-50 px-2.5 py-2 text-xs text-primary-900 dark:bg-primary-950/30 dark:text-primary-200">{report.post_snapshot}</p>
        {report.reviewer_note && <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">{t('decisionNote')}: {report.reviewer_note}</p>}
        {status === 'open' && <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setSelection({ report, decision: 'remove' }); setNote(''); setError(null) }} className="min-h-11 rounded-lg bg-primary-800 px-3 text-xs font-semibold text-white">{t('remove')}</button>
          <button type="button" onClick={() => { setSelection({ report, decision: 'dismiss' }); setNote(''); setError(null) }} className="min-h-11 rounded-lg border border-primary-200 px-3 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">{t('dismiss')}</button>
        </div>}
      </article>)}
      {cursor && <button type="button" onClick={() => void loadMore()} disabled={loadingMore}
        className="min-h-11 w-full rounded-lg border border-primary-200 px-3 text-xs font-semibold text-primary-800 disabled:opacity-50 dark:border-primary-800 dark:text-primary-200">
        {t(loadingMore ? 'loading' : 'more')}
      </button>}
      {selection && <form onSubmit={submit} className="rounded-xl border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-900/40 dark:bg-primary-950/30">
        <label htmlFor="forum-review-note" className="block text-xs font-semibold text-primary-900 dark:text-primary-100">{t('reviewReason', { action: t(selection.decision) })}</label>
        <textarea id="forum-review-note" value={note} onChange={(event) => setNote(event.target.value)} minLength={10} maxLength={500} rows={3} required
          className="mt-2 w-full resize-y rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 dark:border-primary-800 dark:bg-neutral-900" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="submit" disabled={pending || note.trim().length < 10} className="min-h-11 rounded-lg bg-primary-800 px-3 text-xs font-semibold text-white disabled:opacity-50">{t('confirm')}</button>
          <button type="button" onClick={() => setSelection(null)} className="min-h-11 rounded-lg px-3 text-xs font-medium text-primary-800 dark:text-primary-200">{t('cancel')}</button>
        </div>
      </form>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    </div>
  </dialog>
}
