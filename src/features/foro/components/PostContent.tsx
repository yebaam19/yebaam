import Link from 'next/link'
import type { Route } from 'next'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'

// Minimal, safe BBCode-ish renderer for phpBB-style post content.
//
// Supported tags (case-insensitive):
//   [quote="author" post_id="id"]…[/quote]   block quote with jump link
//   [b]…[/b]        [i]…[/i]                 inline bold / italic
//   [u]…[/u]        [s]…[/s]                 inline underline / strike
//   [code]…[/code]                           inline code
//   [url]…[/url]    [url=href]label[/url]    hyperlink (http/https only)
//   [img]url[/img]                           inline image (http/https only)
//
// Plus auto-linking of bare http(s) URLs in text.
//
// Everything is rendered as React nodes — no dangerouslySetInnerHTML and no
// HTML parsing — so there's no injection path even if the post content is
// hostile.

type Node =
  | { kind: 'text'; value: string }
  | {
      kind: 'quote'
      author: string | null
      postId: string | null
      children: Node[]
    }
  | { kind: 'inline'; tag: 'b' | 'i' | 'u' | 's' | 'code'; children: Node[] }
  | { kind: 'url'; href: string; children: Node[] }
  | { kind: 'img'; src: string }

const QUOTE_OPEN_RE =
  /^\[quote(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?(?:\s+post_id=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/i
const INLINE_OPEN_RE = /^\[(b|i|u|s|code)\]/i
const URL_OPEN_RE = /^\[url(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/i
const IMG_RE = /^\[img\]([^[\]]+)\[\/img\]/i
const CLOSE_QUOTE = '[/quote]'
const CLOSE_URL = '[/url]'
const SAFE_URL = /^https?:\/\//i

// Very liberal URL match — linkifies anything that starts with http(s)://
const AUTOLINK_RE = /\bhttps?:\/\/[^\s<>\]]+[^\s<>\].,;:!?)'"]/gi

type ParseOutcome = {
  nodes: Node[]
  consumed: number // how many chars of input we consumed (incl. closing tag for the caller)
  endedBy: 'eof' | 'quote-close' | 'inline-close' | 'url-close'
}

function parseRun(input: string, stopAt: 'eof' | 'quote-close' | 'inline-close' | 'url-close'): ParseOutcome {
  const nodes: Node[] = []
  let i = 0
  const flush = (chunk: string) => {
    if (chunk) nodes.push({ kind: 'text', value: chunk })
  }

  while (i < input.length) {
    const rest = input.slice(i)
    const lower = rest.toLowerCase()

    // Close tags by caller context
    if (stopAt === 'quote-close' && lower.startsWith(CLOSE_QUOTE)) {
      return { nodes, consumed: i + CLOSE_QUOTE.length, endedBy: 'quote-close' }
    }
    if (stopAt === 'url-close' && lower.startsWith(CLOSE_URL)) {
      return { nodes, consumed: i + CLOSE_URL.length, endedBy: 'url-close' }
    }
    if (stopAt === 'inline-close') {
      const m = lower.match(/^\[\/(b|i|u|s|code)\]/)
      if (m) return { nodes, consumed: i + m[0].length, endedBy: 'inline-close' }
    }

    // Opening tags
    const quoteMatch = rest.match(QUOTE_OPEN_RE)
    if (quoteMatch) {
      const author = quoteMatch[1] ?? quoteMatch[2] ?? quoteMatch[3] ?? null
      const postId = quoteMatch[4] ?? quoteMatch[5] ?? quoteMatch[6] ?? null
      const inner = input.slice(i + quoteMatch[0].length)
      const out = parseRun(inner, 'quote-close')
      nodes.push({ kind: 'quote', author, postId, children: out.nodes })
      i += quoteMatch[0].length + out.consumed
      continue
    }

    const imgMatch = rest.match(IMG_RE)
    if (imgMatch) {
      const src = imgMatch[1].trim()
      if (SAFE_URL.test(src)) nodes.push({ kind: 'img', src })
      else flush(imgMatch[0])
      i += imgMatch[0].length
      continue
    }

    const urlMatch = rest.match(URL_OPEN_RE)
    if (urlMatch) {
      const explicit = urlMatch[1] ?? urlMatch[2] ?? urlMatch[3] ?? null
      const inner = input.slice(i + urlMatch[0].length)
      const out = parseRun(inner, 'url-close')
      const label = inner.slice(0, out.consumed - CLOSE_URL.length)
      const href = explicit ?? label.trim()
      if (SAFE_URL.test(href)) nodes.push({ kind: 'url', href, children: out.nodes })
      else nodes.push(...out.nodes)
      i += urlMatch[0].length + out.consumed
      continue
    }

    const inlineMatch = rest.match(INLINE_OPEN_RE)
    if (inlineMatch) {
      const tag = inlineMatch[1].toLowerCase() as 'b' | 'i' | 'u' | 's' | 'code'
      const inner = input.slice(i + inlineMatch[0].length)
      const out = parseRun(inner, 'inline-close')
      nodes.push({ kind: 'inline', tag, children: out.nodes })
      i += inlineMatch[0].length + out.consumed
      continue
    }

    // Plain text: consume until the next '[' (tag start) or end
    const nextTag = rest.indexOf('[')
    if (nextTag === -1) {
      flush(rest)
      i = input.length
      break
    }
    if (nextTag === 0) {
      // A '[' that didn't match any tag — consume as literal char and advance.
      flush('[')
      i += 1
      continue
    }
    flush(rest.slice(0, nextTag))
    i += nextTag
  }

  return { nodes, consumed: i, endedBy: 'eof' }
}

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
  const { nodes } = parseRun(content, 'eof')
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
