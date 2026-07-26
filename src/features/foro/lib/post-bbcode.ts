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

// Sticky (`y`) rather than anchored (`^`): matched against the full input at a
// position, so the scan never has to slice the remaining string. With `^` on a
// fresh `input.slice(i)` every iteration, a body of N '[' characters cost O(N)
// per step — quadratic overall, and ~200 KB of '[' was enough to stall the
// server render and freeze each viewer's tab.
const QUOTE_OPEN_RE =
  /\[quote(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?(?:\s+post_id=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/iy
const INLINE_OPEN_RE = /\[(b|i|u|s|code)\]/iy
const URL_OPEN_RE = /\[url(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/iy
const IMG_RE = /\[img\]([^[\]]+)\[\/img\]/iy
const INLINE_CLOSE_RE = /\[\/(b|i|u|s|code)\]/iy
const CLOSE_QUOTE = '[/quote]'
const CLOSE_URL = '[/url]'
const SAFE_URL = /^https?:\/\//i

/**
 * Hard ceiling on tag nesting.
 *
 * `parseRun` recurses once per nested open tag, so a body of `[b]` repeated
 * ~20k times (about 60 KB — well under the Server Action body limit) exhausted
 * the Node call stack *during SSR*. That turns the topic page into a 500 for
 * every visitor, including the moderators who would delete the post. Past this
 * depth an open tag is treated as literal text instead of opening a new frame.
 */
const MAX_DEPTH = 32

/**
 * Maximum characters in a forum post or topic body. Enforced by the Server
 * Actions that write posts and, defensively, by `parsePostContent` on read.
 * Generous for prose; the point is that "unbounded" is what made a single post
 * able to break a page for everyone.
 */
export const MAX_POST_CONTENT_CHARS = 20_000

/** Match a sticky regex at `pos` without slicing the input. */
function matchAt(re: RegExp, input: string, pos: number): RegExpExecArray | null {
  re.lastIndex = pos
  return re.exec(input)
}

type ParseOutcome = {
  nodes: Node[]
  consumed: number // how many chars of input we consumed (incl. closing tag for the caller)
  endedBy: 'eof' | 'quote-close' | 'inline-close' | 'url-close'
}

function parseRun(
  input: string,
  stopAt: 'eof' | 'quote-close' | 'inline-close' | 'url-close',
  depth = 0,
): ParseOutcome {
  const nodes: Node[] = []
  // One lowercase pass for the whole run instead of one per character scanned.
  const lower = input.toLowerCase()
  let i = 0
  const flush = (chunk: string) => {
    if (chunk) nodes.push({ kind: 'text', value: chunk })
  }

  while (i < input.length) {
    // Close tags by caller context
    if (stopAt === 'quote-close' && lower.startsWith(CLOSE_QUOTE, i)) {
      return { nodes, consumed: i + CLOSE_QUOTE.length, endedBy: 'quote-close' }
    }
    if (stopAt === 'url-close' && lower.startsWith(CLOSE_URL, i)) {
      return { nodes, consumed: i + CLOSE_URL.length, endedBy: 'url-close' }
    }
    if (stopAt === 'inline-close') {
      const m = matchAt(INLINE_CLOSE_RE, lower, i)
      if (m) return { nodes, consumed: i + m[0].length, endedBy: 'inline-close' }
    }

    const canNest = depth < MAX_DEPTH

    // Opening tags
    const quoteMatch = canNest ? matchAt(QUOTE_OPEN_RE, input, i) : null
    if (quoteMatch) {
      const author = quoteMatch[1] ?? quoteMatch[2] ?? quoteMatch[3] ?? null
      const postId = quoteMatch[4] ?? quoteMatch[5] ?? quoteMatch[6] ?? null
      const inner = input.slice(i + quoteMatch[0].length)
      const out = parseRun(inner, 'quote-close', depth + 1)
      nodes.push({ kind: 'quote', author, postId, children: out.nodes })
      i += quoteMatch[0].length + out.consumed
      continue
    }

    const imgMatch = matchAt(IMG_RE, input, i)
    if (imgMatch) {
      const src = imgMatch[1].trim()
      if (SAFE_URL.test(src)) nodes.push({ kind: 'img', src })
      else flush(imgMatch[0])
      i += imgMatch[0].length
      continue
    }

    const urlMatch = canNest ? matchAt(URL_OPEN_RE, input, i) : null
    if (urlMatch) {
      const explicit = urlMatch[1] ?? urlMatch[2] ?? urlMatch[3] ?? null
      const inner = input.slice(i + urlMatch[0].length)
      const out = parseRun(inner, 'url-close', depth + 1)
      const label = inner.slice(0, out.consumed - CLOSE_URL.length)
      const href = explicit ?? label.trim()
      if (SAFE_URL.test(href)) nodes.push({ kind: 'url', href, children: out.nodes })
      else nodes.push(...out.nodes)
      i += urlMatch[0].length + out.consumed
      continue
    }

    const inlineMatch = canNest ? matchAt(INLINE_OPEN_RE, input, i) : null
    if (inlineMatch) {
      const tag = inlineMatch[1].toLowerCase() as 'b' | 'i' | 'u' | 's' | 'code'
      const inner = input.slice(i + inlineMatch[0].length)
      const out = parseRun(inner, 'inline-close', depth + 1)
      nodes.push({ kind: 'inline', tag, children: out.nodes })
      i += inlineMatch[0].length + out.consumed
      continue
    }

    // Plain text: consume until the next '[' (tag start) or end
    const nextTag = input.indexOf('[', i)
    if (nextTag === -1) {
      flush(input.slice(i))
      i = input.length
      break
    }
    if (nextTag === i) {
      // A '[' that didn't match any tag — consume as literal char and advance.
      flush('[')
      i += 1
      continue
    }
    flush(input.slice(i, nextTag))
    i = nextTag
  }

  return { nodes, consumed: i, endedBy: 'eof' }
}

/**
 * Parse a raw post body into a safe `Node` tree for rendering.
 *
 * The length cap is a second line of defence behind the server-side check in
 * `createPost` / `editPost` / `createTopic`: this function also runs during SSR
 * for rows that predate that check, and one un-renderable row makes the whole
 * topic page 500 for everyone.
 */
export function parsePostContent(content: string): Node[] {
  const bounded =
    content.length > MAX_POST_CONTENT_CHARS ? content.slice(0, MAX_POST_CONTENT_CHARS) : content
  return parseRun(bounded, 'eof').nodes
}
