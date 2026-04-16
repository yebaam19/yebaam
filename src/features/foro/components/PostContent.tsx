import Link from 'next/link'
import type { Route } from 'next'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'

// Very small BBCode-ish renderer scoped to phpBB-style [quote="author" post_id="id"]...[/quote]
// blocks. We intentionally do NOT use dangerouslySetInnerHTML — everything is
// rendered as React nodes so there's no injection path. Handles nested quotes,
// ignores unknown tags (they render as text).

type Node =
  | { kind: 'text'; value: string }
  | {
      kind: 'quote'
      author: string | null
      postId: string | null
      children: Node[]
    }

const OPEN_RE = /\[quote(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?(?:\s+post_id=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/i
const CLOSE = '[/quote]'

function parse(input: string): Node[] {
  const out: Node[] = []
  let i = 0
  while (i < input.length) {
    const rest = input.slice(i)
    const openMatch = rest.match(OPEN_RE)
    const openIdx = openMatch?.index ?? -1
    const closeIdx = rest.toLowerCase().indexOf(CLOSE)

    // No more tags — emit remaining text and stop
    if (openIdx === -1 && closeIdx === -1) {
      if (rest.length > 0) out.push({ kind: 'text', value: rest })
      return out
    }

    // A close tag appears before (or without) a next open: consume up to it and
    // let the caller pick it up.
    if (closeIdx !== -1 && (openIdx === -1 || closeIdx < openIdx)) {
      const textBefore = rest.slice(0, closeIdx)
      if (textBefore.length > 0) out.push({ kind: 'text', value: textBefore })
      return out
    }

    // Text before the open tag
    if (openIdx > 0) {
      out.push({ kind: 'text', value: rest.slice(0, openIdx) })
    }

    const openLen = openMatch![0].length
    const author =
      openMatch![1] ?? openMatch![2] ?? openMatch![3] ?? null
    const postId =
      openMatch![4] ?? openMatch![5] ?? openMatch![6] ?? null
    const inner = rest.slice(openIdx + openLen)
    const innerNodes = parse(inner)
    out.push({ kind: 'quote', author, postId, children: innerNodes })

    // Advance cursor past the inner content + its close tag
    const consumedInner = nodesToLength(innerNodes)
    i += openIdx + openLen + consumedInner + CLOSE.length
  }
  return out
}

function nodesToLength(nodes: Node[]): number {
  // Reconstruct the byte length we consumed from the input so we can advance
  // the outer cursor. Since parse emits "text" values unchanged and never
  // trims, summing their lengths works.
  let total = 0
  for (const n of nodes) {
    if (n.kind === 'text') total += n.value.length
    else total += openSourceLength(n) + nodesToLength(n.children) + CLOSE.length
  }
  return total
}

function openSourceLength(q: Extract<Node, { kind: 'quote' }>): number {
  let src = '[quote'
  if (q.author !== null) src += `="${q.author}"`
  if (q.postId !== null) src += ` post_id="${q.postId}"`
  src += ']'
  return src.length
}

function renderNodes(
  nodes: Node[],
  opts: { topicHref?: string },
  keyPrefix = '',
): React.ReactNode[] {
  return nodes.map((n, idx) => {
    const key = `${keyPrefix}${idx}`
    if (n.kind === 'text') {
      const trimmed = n.value.replace(/^\n+/, '').replace(/\n+$/, '')
      if (!trimmed) return null
      return <span key={key}>{trimmed}</span>
    }
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
}

export default function PostContent({ content, topicHref }: Props) {
  const nodes = parse(content)
  const rendered = renderNodes(nodes, { topicHref })
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
      {rendered}
    </div>
  )
}
