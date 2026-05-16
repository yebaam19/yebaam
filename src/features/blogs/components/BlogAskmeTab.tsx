'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CheckIcon, QuestionMarkCircleIcon, TrashIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useFetch } from '@/lib/hooks/useFetch'
import { cacheKey, invalidate } from '@/lib/hooks/cacheStore'
import {
  answerQuestionAction,
  approveQuestionAction,
  askQuestionAction,
  deleteQuestionAction,
  getAskmeBoardAction,
  rejectQuestionAction,
} from '@/features/askme/actions/askme.actions'
import type { AskmeQuestion } from '@/features/askme/types'

interface Props {
  blogId: string
  blogName: string
}

type OwnerView = 'public' | 'pending' | 'awaiting'

export function BlogAskmeTab({ blogId, blogName }: Props) {
  const t = useTranslations('blogs.askmeTab')
  const queryKey = ['askme', 'board', blogId]
  const { data, isLoading, error } = useFetch(
    queryKey,
    () => getAskmeBoardAction(blogId),
    { staleTime: 1000 * 15 },
  )
  const refresh = () => invalidate(cacheKey(...queryKey))

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-20 rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
        {t('loadError')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AskComposer blogId={blogId} blogName={blogName} onAsked={refresh} />
      {data.isOwner && data.stats ? (
        <OwnerBoard data={data} blogId={blogId} onChange={refresh} />
      ) : (
        <PublicList questions={data.publicQuestions} blogName={blogName} />
      )}
    </div>
  )
}

function AskComposer({
  blogId,
  blogName,
  onAsked,
}: {
  blogId: string
  blogName: string
  onAsked: () => void
}) {
  const t = useTranslations('blogs.askmeTab.composer')
  const [question, setQuestion] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSentMessage(null)
    startTransition(async () => {
      const result = await askQuestionAction({ blogId, question, isAnonymous })
      if (!result.ok) {
        setError(result.error ?? t('errorDefault'))
        return
      }
      setQuestion('')
      setIsAnonymous(false)
      setSentMessage(t('successSent'))
      onAsked()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('title', { blogName })}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('hint')}
          </p>
        </div>
      </div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        maxLength={1000}
        disabled={isPending}
        placeholder={t('placeholder')}
        className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          {t('anonymousLabel')}
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">{question.length}/1000</span>
          <button
            type="submit"
            disabled={isPending || !question.trim()}
            className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      {sentMessage && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{sentMessage}</p>
      )}
    </form>
  )
}

function PublicList({ questions, blogName }: { questions: AskmeQuestion[]; blogName: string }) {
  const t = useTranslations('blogs.askmeTab.publicList')
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
        {t('empty', { blogName })}
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </ul>
  )
}

function OwnerBoard({
  data,
  blogId,
  onChange,
}: {
  data: NonNullable<Awaited<ReturnType<typeof getAskmeBoardAction>>>
  blogId: string
  onChange: () => void
}) {
  const tStats = useTranslations('blogs.askmeTab.stats')
  const tTabs = useTranslations('blogs.askmeTab.tabs')
  const tList = useTranslations('blogs.askmeTab.publicList')
  const [view, setView] = useState<OwnerView>(
    data.pendingQuestions.length > 0 ? 'pending' : 'public',
  )
  const stats = data.stats!

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Stat label={tStats('received')} value={stats.total} />
        <Stat label={tStats('pending')} value={stats.pending} accent={stats.pending > 0} />
        <Stat label={tStats('answered')} value={stats.answered} />
        <Stat label={tStats('responseRate')} value={`${stats.responseRate}%`} />
      </div>
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <ViewTab active={view === 'pending'} onClick={() => setView('pending')}>
          {tTabs('pending')} {stats.pending > 0 && <Badge>{stats.pending}</Badge>}
        </ViewTab>
        <ViewTab active={view === 'awaiting'} onClick={() => setView('awaiting')}>
          {tTabs('awaiting')} {data.awaitingAnswer.length > 0 && <Badge>{data.awaitingAnswer.length}</Badge>}
        </ViewTab>
        <ViewTab active={view === 'public'} onClick={() => setView('public')}>
          {tTabs('public')}
        </ViewTab>
      </div>
      {view === 'pending' && (
        <PendingList questions={data.pendingQuestions} blogId={blogId} onChange={onChange} />
      )}
      {view === 'awaiting' && (
        <AwaitingList questions={data.awaitingAnswer} blogId={blogId} onChange={onChange} />
      )}
      {view === 'public' && <PublicList questions={data.publicQuestions} blogName={tList('thisBlog')} />}
    </div>
  )
}

function PendingList({
  questions,
  blogId,
  onChange,
}: {
  questions: AskmeQuestion[]
  blogId: string
  onChange: () => void
}) {
  const t = useTranslations('blogs.askmeTab.pendingList')
  if (questions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
        {t('empty')}
      </p>
    )
  }
  return (
    <ul className="space-y-3">
      {questions.map((q) => (
        <PendingCard key={q.id} question={q} blogId={blogId} onChange={onChange} />
      ))}
    </ul>
  )
}

function AwaitingList({
  questions,
  blogId,
  onChange,
}: {
  questions: AskmeQuestion[]
  blogId: string
  onChange: () => void
}) {
  const t = useTranslations('blogs.askmeTab.awaitingList')
  if (questions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
        {t('empty')}
      </p>
    )
  }
  return (
    <ul className="space-y-3">
      {questions.map((q) => (
        <AnswerCard key={q.id} question={q} blogId={blogId} onChange={onChange} />
      ))}
    </ul>
  )
}

function PendingCard({
  question,
  blogId,
  onChange,
}: {
  question: AskmeQuestion
  blogId: string
  onChange: () => void
}) {
  const t = useTranslations('blogs.askmeTab.pendingCard')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (action: 'approve' | 'reject' | 'delete') => {
    setError(null)
    startTransition(async () => {
      const fn =
        action === 'approve'
          ? approveQuestionAction
          : action === 'reject'
            ? rejectQuestionAction
            : deleteQuestionAction
      const result = await fn(blogId, question.id)
      if (!result.ok) {
        setError(result.error ?? t('errorDefault'))
        return
      }
      onChange()
    })
  }

  return (
    <li className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <QuestionHeader question={question} forceShowAsker />
      <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-100">{question.question}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run('approve')}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <CheckIcon className="h-3.5 w-3.5" />
          {t('approve')}
        </button>
        <button
          type="button"
          onClick={() => run('reject')}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800 dark:bg-neutral-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
          {t('reject')}
        </button>
        <button
          type="button"
          onClick={() => run('delete')}
          disabled={isPending}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          title={t('deleteTitle')}
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </li>
  )
}

function AnswerCard({
  question,
  blogId,
  onChange,
}: {
  question: AskmeQuestion
  blogId: string
  onChange: () => void
}) {
  const t = useTranslations('blogs.askmeTab.answerCard')
  const [draft, setDraft] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await answerQuestionAction(blogId, question.id, draft)
      if (!result.ok) {
        setError(result.error ?? t('errorDefault'))
        return
      }
      setDraft('')
      onChange()
    })
  }

  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <QuestionHeader question={question} forceShowAsker />
      <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-100">{question.question}</p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        maxLength={4000}
        placeholder={t('placeholder')}
        disabled={isPending}
        className="mt-3 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <span className="text-xs text-neutral-400">{draft.length}/4000</span>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !draft.trim()}
          className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isPending ? t('submitting') : t('submit')}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </li>
  )
}

function QuestionCard({ question }: { question: AskmeQuestion }) {
  const t = useTranslations('blogs.askmeTab.questionCard')
  const locale = useLocale()
  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <QuestionHeader question={question} />
      <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-100">{question.question}</p>
      {question.answer && (
        <div className="mt-3 rounded-lg bg-primary-50 p-3 text-sm text-neutral-800 dark:bg-primary-950/30 dark:text-neutral-100">
          <p className="mb-1 text-[10px] font-semibold tracking-wide text-primary-700 uppercase dark:text-primary-300">
            {t('answerLabel')}
          </p>
          <p>{question.answer}</p>
          {question.answeredAt && (
            <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              {new Date(question.answeredAt).toLocaleString(locale)}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

function QuestionHeader({
  question,
  forceShowAsker = false,
}: {
  question: AskmeQuestion
  forceShowAsker?: boolean
}) {
  const t = useTranslations('blogs.askmeTab.questionHeader')
  const locale = useLocale()
  const showAnonymous = question.isAnonymous && !forceShowAsker
  const label = showAnonymous ? t('anonymous') : question.asker?.displayName ?? t('anonymous')
  return (
    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
      <span className="font-medium text-neutral-700 dark:text-neutral-200">
        {label}
        {forceShowAsker && question.isAnonymous && (
          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {t('publicAnonymousTag')}
          </span>
        )}
      </span>
      <span>{new Date(question.createdAt).toLocaleDateString(locale)}</span>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
        {label}
      </p>
      <p
        className={
          'mt-1 text-xl font-bold ' +
          (accent ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100')
        }
      >
        {value}
      </p>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        '-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ' +
        (active
          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300')
      }
    >
      {children}
    </button>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
      {children}
    </span>
  )
}
