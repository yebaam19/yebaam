'use client'

import { useState, useTransition } from 'react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import {
  grantBlogBadgeAction,
  revokeBlogBadgeAction,
  setBlogVerificationAction,
} from '@/features/admin/actions/blog-admin.actions'
import type { AdminBlogBadge, AdminBlogRow, BadgeOption } from '@/features/admin/server/blogs.server'

type Distinction = 'local' | 'national' | 'international'

const DISTINCTIONS: ReadonlyArray<{ value: '' | Distinction; label: string }> = [
  { value: '', label: 'Sin distinción' },
  { value: 'local', label: 'Local' },
  { value: 'national', label: 'Nacional' },
  { value: 'international', label: 'Internacional' },
]

const selectCls =
  'rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 focus:border-primary-500 focus:outline-none disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100'

export function AdminBlogsTable({ blogs, badgeOptions }: { blogs: AdminBlogRow[]; badgeOptions: BadgeOption[] }) {
  if (blogs.length === 0) {
    return <p className="p-6 text-sm text-neutral-500 dark:text-neutral-400">No hay blogs todavía.</p>
  }
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {blogs.map((b) => (
        <Row key={b.id} blog={b} badgeOptions={badgeOptions} />
      ))}
    </div>
  )
}

function Row({ blog, badgeOptions }: { blog: AdminBlogRow; badgeOptions: BadgeOption[] }) {
  const [isVerified, setIsVerified] = useState(blog.isVerified)
  const [distinction, setDistinction] = useState<'' | Distinction>((blog.distinction as Distinction) ?? '')
  const [badges, setBadges] = useState<AdminBlogBadge[]>(blog.badges)
  const [grantSel, setGrantSel] = useState('')
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const saveVerification = (nextVerified: boolean, nextDistinction: '' | Distinction) => {
    setErr(null)
    startTransition(async () => {
      const res = await setBlogVerificationAction({
        blogId: blog.id,
        isVerified: nextVerified,
        distinction: nextDistinction || null,
      })
      if (!res.ok) setErr(res.error ?? 'Error')
    })
  }

  const grant = (badgeId: string) => {
    if (!badgeId) return
    setErr(null)
    startTransition(async () => {
      const res = await grantBlogBadgeAction({ blogId: blog.id, badgeId })
      if (!res.ok) {
        setErr(res.error ?? 'Error')
        return
      }
      const opt = badgeOptions.find((o) => o.id === badgeId)
      if (opt && !badges.some((b) => b.slug === opt.slug)) {
        setBadges([...badges, { slug: opt.slug, name: opt.name }])
      }
      setGrantSel('')
    })
  }

  const revoke = (slug: string) => {
    setErr(null)
    startTransition(async () => {
      const res = await revokeBlogBadgeAction({ blogId: blog.id, badgeSlug: slug })
      if (!res.ok) {
        setErr(res.error ?? 'Error')
        return
      }
      setBadges(badges.filter((b) => b.slug !== slug))
    })
  }

  return (
    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{blog.name}</p>
        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
          {blog.ownerUsername ? `@${blog.ownerUsername}` : '—'} · {blog.ownerName} ·{' '}
          {blog.followersCount.toLocaleString('es-ES')} seguidores
        </p>
        {badges.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b.slug}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              >
                {b.name}
                <button
                  type="button"
                  onClick={() => revoke(b.slug)}
                  disabled={pending}
                  title="Quitar insignia"
                  className="rounded-full hover:text-rose-600 disabled:opacity-50"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-200">
        <input
          type="checkbox"
          checked={isVerified}
          disabled={pending}
          onChange={(e) => {
            setIsVerified(e.target.checked)
            saveVerification(e.target.checked, distinction)
          }}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        Autenticado
      </label>

      <select
        value={distinction}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value as '' | Distinction
          setDistinction(v)
          saveVerification(isVerified, v)
        }}
        className={selectCls}
        aria-label="Distinción"
      >
        {DISTINCTIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      <select
        value={grantSel}
        disabled={pending}
        onChange={(e) => {
          setGrantSel(e.target.value)
          grant(e.target.value)
        }}
        className={selectCls}
        aria-label="Otorgar insignia"
      >
        <option value="">+ Insignia…</option>
        {badgeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      {err && <span className="shrink-0 text-xs text-rose-500">{err}</span>}
    </div>
  )
}
