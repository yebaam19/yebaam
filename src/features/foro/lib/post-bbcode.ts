// Minimal, safe inline-markup parser for Yebaam post content.
//
// Supported tags (case-insensitive):
//   [quote="author" post_id="id"]…[/quote]   block quote with jump link
//   [b]…[/b]        [i]…[/i]                 inline bold / italic
//   [u]…[/u]        [s]…[/s]                 inline underline / strike
//   [code]…[/code]                           inline code
//   [url]…[/url]    [url=href]label[/url]    hyperlink (http/https only)
//   [img]url[/img]                           inline image (http/https only)
//
// Plus auto-linking of bare http(s) URLs in text (handled by the renderer).
//
// The parser produces a tree of `Node`s — no HTML, no dangerouslySetInnerHTML —
// so there is no injection path even if the post content is hostile. The
// rendering of these nodes into React lives in `PostContent.tsx`.

export type Node =
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

/** Parse a raw post body into a safe `Node` tree for rendering. */
export function parsePostContent(content: string): Node[] {
  return parseRun(content, 'eof').nodes
}
