'use client'

import { BlogMembersPanel } from '@/features/blogs/components/detail/BlogMembersPanel'
import { BlogEventsPanel } from '@/features/blogs/components/detail/BlogEventsPanel'
import { BlogSideMenu, type BlogSideMenuItem } from '@/features/blogs/components/detail/BlogSideMenu'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import type { Blog } from '@/features/blogs/types/blog.types'

const MENU_LABELS: Record<BlogSideMenuItem, string> = {
  chat: 'Chat Público',
  members: 'Miembros y Seguidores',
  askme: 'Askme',
  foro: 'Foro',
  events: 'Eventos',
  promotions: 'Promociones',
  related: 'Páginas Relacionadas',
}

interface BlogDetailSideMenuProps {
  blog: Blog
  /** Currently opened overlay panel, or null when closed. Parent owns this state. */
  openedMenu: BlogSideMenuItem | null
  /** Fired when the user picks a menu item; parent decides routing/tab/overlay. */
  onSelect: (item: BlogSideMenuItem) => void | Promise<void>
  /** Closes the overlay panel. */
  onCloseMenu: () => void
}

/** Left vertical menu + the overlay panel it opens (members / events / related). */
export function BlogDetailSideMenu({ blog, openedMenu, onSelect, onCloseMenu }: BlogDetailSideMenuProps) {
  return (
    <>
      <BlogSideMenu
        followersCount={blog.stats?.followersCount ?? 0}
        isOwner={!!blog.isOwner}
        onSelect={onSelect}
      />

      {openedMenu && (
        <MenuPanel title={MENU_LABELS[openedMenu]} onClose={onCloseMenu}>
          <MenuPanelBody item={openedMenu} blog={blog} />
        </MenuPanel>
      )}
    </>
  )
}

function MenuPanel({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function MenuPanelBody({ item, blog }: { item: BlogSideMenuItem; blog: Blog }) {
  if (item === 'members') {
    return <BlogMembersPanel blogId={blog.id} />
  }

  if (item === 'events') {
    return <BlogEventsPanel blogId={blog.id} isOwner={!!blog.isOwner} />
  }

  if (item === 'related') {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Aún no se han añadido páginas relacionadas. El bloguero podrá enlazar páginas internas y externas.
      </p>
    )
  }

  return null
}
