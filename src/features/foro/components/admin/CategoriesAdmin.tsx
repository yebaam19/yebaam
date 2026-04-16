'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteCategory,
  deleteForum,
  upsertCategory,
  upsertForum,
} from '@/features/foro/actions/admin.actions'
import type { ForoCategory, ForoForum, ForoSpace } from '@/features/foro/types'

interface Props {
  space: ForoSpace
  categories: ForoCategory[]
}

export default function CategoriesAdmin({ space, categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [forumForms, setForumForms] = useState<
    Record<string, { name: string; description: string; parent: string }>
  >({})
  const [error, setError] = useState<string | null>(null)

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newCategoryName.trim()
    if (!name) return
    setError(null)
    startTransition(async () => {
      const result = await upsertCategory({ spaceId: space.id, name })
      if (!result.ok) {
        setError(result.error ?? 'Error')
        return
      }
      setNewCategoryName('')
      router.refresh()
    })
  }

  const handleDeleteCategory = (id: string) => {
    if (!confirm('¿Eliminar esta categoría y todos sus foros?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (!result.ok) {
        setError(result.error ?? 'Error')
        return
      }
      router.refresh()
    })
  }

  const getForumForm = (catId: string) =>
    forumForms[catId] ?? { name: '', description: '', parent: '' }

  const updateForumForm = (
    catId: string,
    key: 'name' | 'description' | 'parent',
    value: string,
  ) => {
    setForumForms((prev) => ({
      ...prev,
      [catId]: { ...getForumForm(catId), [key]: value },
    }))
  }

  const handleCreateForum = (cat: ForoCategory) => (e: React.FormEvent) => {
    e.preventDefault()
    const form = getForumForm(cat.id)
    const name = form.name.trim()
    if (!name) return
    setError(null)
    startTransition(async () => {
      const result = await upsertForum({
        spaceId: space.id,
        categoryId: cat.id,
        parentForumId: form.parent || null,
        name,
        description: form.description.trim() || null,
      })
      if (!result.ok) {
        setError(result.error ?? 'Error')
        return
      }
      setForumForms((prev) => ({ ...prev, [cat.id]: { name: '', description: '', parent: '' } }))
      router.refresh()
    })
  }

  const handleDeleteForum = (forumId: string) => {
    if (!confirm('¿Eliminar este foro y todos sus temas?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteForum(forumId)
      if (!result.ok) {
        setError(result.error ?? 'Error')
        return
      }
      router.refresh()
    })
  }

  const flattenForums = (forums: ForoForum[]): ForoForum[] => {
    const out: ForoForum[] = []
    for (const f of forums) {
      out.push(f)
      out.push(...flattenForums(f.subforums))
    }
    return out
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        onSubmit={handleCreateCategory}
        className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nueva categoría"
          className="min-w-45 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
        <button
          type="submit"
          disabled={isPending || !newCategoryName.trim()}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          Añadir categoría
        </button>
      </form>

      {categories.map((cat) => {
        const allForums = flattenForums(cat.forums)
        const form = getForumForm(cat.id)
        return (
          <section
            key={cat.id}
            className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {cat.name}
              </h3>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </header>

            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {allForums.length === 0 ? (
                <li className="px-4 py-3 text-sm text-neutral-500">Sin foros.</li>
              ) : (
                allForums.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                  >
                    <div>
                      <span
                        className={
                          f.parentForumId
                            ? 'pl-4 text-neutral-600 dark:text-neutral-400'
                            : 'font-medium text-neutral-900 dark:text-neutral-100'
                        }
                      >
                        {f.parentForumId ? '↳ ' : ''}
                        {f.name}
                      </span>
                      {f.description && (
                        <span className="ml-2 text-xs text-neutral-500">{f.description}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteForum(f.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </li>
                ))
              )}
            </ul>

            <form
              onSubmit={handleCreateForum(cat)}
              className="space-y-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div className="flex flex-wrap gap-2">
                <input
                  value={form.name}
                  onChange={(e) => updateForumForm(cat.id, 'name', e.target.value)}
                  placeholder="Nombre del foro"
                  className="min-w-40 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
                <select
                  value={form.parent}
                  onChange={(e) => updateForumForm(cat.id, 'parent', e.target.value)}
                  className="min-w-40 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="">— Sin padre —</option>
                  {cat.forums
                    .filter((f) => f.parentForumId === null)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        Subforo de: {f.name}
                      </option>
                    ))}
                </select>
              </div>
              <input
                value={form.description}
                onChange={(e) => updateForumForm(cat.id, 'description', e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending || !form.name.trim()}
                  className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
                >
                  Añadir foro
                </button>
              </div>
            </form>
          </section>
        )
      })}
    </div>
  )
}
