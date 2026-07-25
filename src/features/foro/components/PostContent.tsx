import Link from 'next/link'
import type { Route } from 'next'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'
import { parsePostContent, type Node } from '../lib/post-bbcode'

// Renders the safe `Node` tree produced by `parsePostContent` into React —
// no dangerouslySetInnerHTML, no HTML parsing — plus auto-linking of bare
// http(s) URLs in text. See `../lib/post-bbcode` for the grammar.

// Very liberal URL match — linkifies anything that starts with http(s)://
const AUTOLINK_RE = /\bhttps?:\/\/[^\s<>\]]+[^\s<>\].,;:!?)'"]/gi

function autolink(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  let match: RegExpExecArray | null
  AUTOLINK_RE.lastIndex = 0
  let i = 0
  while ((match = AUTOLINK_RE.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    parts.push(
      <a
        key={`${keyPrefix}-al-${i++}`}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-700 underline hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
      >
        {match[0]}
      </a>,
    )
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
}

function renderNodes(
  nodes: Node[],
  opts: { topicHref?: string },
  keyPrefix = '',
): React.ReactNode[] {
  return nodes.map((n, idx) => {
    const key = `${keyPrefix}${idx}`
    if (n.kind === 'text') return <span key={key}>{autolink(n.value, key)}</span>
    if (n.kind === 'img')
      return (
        <img
          key={key}
          src={n.src}
          alt=""
          className="my-2 max-h-96 max-w-full rounded-lg border border-neutral-200 object-contain dark:border-neutral-800"
          decoding="async"
          loading="lazy"
        />
      )
    if (n.kind === 'inline') {
      const inner = renderNodes(n.children, opts, `${key}-`)
      switch (n.tag) {
        case 'b':
          return <strong key={key}>{inner}</strong>
        case 'i':
          return <em key={key}>{inner}</em>
        case 'u':
          return <u key={key}>{inner}</u>
        case 's':
          return <s key={key}>{inner}</s>
        case 'code':
          return (
            <code
              key={key}
              className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {inner}
            </code>
          )
      }
    }
    if (n.kind === 'url') {
      const label = renderNodes(n.children, opts, `${key}-`)
      return (
        <a
          key={key}
          href={n.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-700 underline hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {label}
        </a>
      )
    }
    // quote
    const jumpHref = opts.topicHref && n.postId ? `${opts.topicHref}?p=${n.postId}#p${n.postId}` : null
    return (
      <blockquote
        key={key}
        className="my-2 rounded-lg border-l-4 border-primary-400 bg-primary-50/60 px-3 py-2 text-sm text-neutral-700 dark:border-primary-600 dark:bg-primary-900/20 dark:text-neutral-200"
      >
        {(n.author || jumpHref) && (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-primary-800 dark:text-primary-300">
            <ChatBubbleLeftRightIcon className="h-3 w-3" />
            {n.author && <span>{n.author} escribió:</span>}
            {jumpHref && (
              <Link
                href={jumpHref as Route}
                className="ml-auto text-primary-700 hover:underline dark:text-primary-400"
              >
                ver mensaje ↗
              </Link>
            )}
          </div>
        )}
        <div className="whitespace-pre-wrap">{renderNodes(n.children, opts, `${key}-`)}</div>
      </blockquote>
    )
  })
}

interface Props {
  content: string
  topicHref?: string
  className?: string
}

export default function PostContent({ content, topicHref, className }: Props) {
  const nodes = parsePostContent(content)
  return (
    <div
      className={
        className ??
        'text-sm leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200'
      }
    >
      {renderNodes(nodes, { topicHref })}
    </div>
  )
}
