# CLAUDE.md

See [AGENTS.md](AGENTS.md) for all project conventions (package manager, stack, layout, Next.js 16 features, code style, Supabase client wrappers, realtime patterns, storage RLS).

This file exists so Claude Code picks up the same rules as other AI tools. All guidance lives in `AGENTS.md` — keep them in sync by editing `AGENTS.md` only.

## Backend (TL;DR)

The backend is **Supabase** — accessed via `@supabase/supabase-js` and `@supabase/ssr` through wrappers under `@/utils/supabase/*`. There is no custom backend / Express / NestJS layer. All data access (auth, database, storage, realtime) goes through those wrappers — never reach into `@supabase/*` directly outside `src/utils/supabase/`.

Use `.maybeSingle()` (not `.single()`) when a row may legitimately be missing — `.single()` returns HTTP 406 for zero rows.

## HTTP layer (TL;DR)

Do **not** add or use any axios / legacy HTTP client. For anything that cannot be expressed as a direct `@supabase/supabase-js` call from the browser (server-only secrets, token stitching, aggregation, webhooks, OAuth callbacks), use **Next.js App Router Route Handlers** under `src/app/api/**/route.ts`:

- File convention: [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- Full App Router API reference: [API Reference](https://nextjs.org/docs/app/api-reference)
- Export named HTTP methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) from `route.ts`. Use `NextRequest` / `NextResponse`.
- Read cookies/headers via `next/headers` (`await cookies()`, `await headers()`).
- On the server, build a Supabase client with `getServerClient()` from `@/utils/supabase/server` so the caller's session is forwarded.
- From the client, call the route with `fetch('/api/...')` — never through a shared axios-style wrapper.

## Realtime (TL;DR)

**Senders just write rows.** The DB INSERT IS the broadcast. Subscribers use `subscribeToTable()` from `@/utils/supabase/realtime`. See AGENTS.md for the canonical pattern and the list of tables enabled on `supabase_realtime`.

The only place where Broadcast (ephemeral, no DB) is appropriate is signals like typing indicators, presence, cursor positions — anything without a row.
