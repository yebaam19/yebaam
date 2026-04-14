---
description: Project conventions for the Next.js 16 + Supabase app
globs: *
alwaysApply: true
---

# Project conventions

This is a Next.js 16 (App Router, Turbopack) social app backed by **Supabase** for database, auth, storage, realtime, and edge functions. The frontend ships TypeScript only — no axios, no jQuery, no legacy HTTP wrappers.

## Backend: Supabase

- **Database**: Postgres + PostgREST, accessed via `@supabase/supabase-js`.
- **Auth**: `@supabase/ssr` for cookie-managed sessions across server + client.
- **Storage**: `supabase.storage.from(bucket)` — buckets `avatars`, `covers`, `posts`, `profile-photos`, `profile-videos`, `stories`.
- **Realtime**: `postgres_changes` on tables (the canonical pattern — write a row, every subscriber gets it for free) plus Broadcast channels for ephemeral signals like typing indicators. Both wrapped by [src/utils/supabase/realtime.ts](src/utils/supabase/realtime.ts).
- **Edge Functions**: live under `supabase/functions/<name>/index.ts`. Three currently deployed: `feed`, `send-email`, `story-cleanup`.

## Client wrappers — always import from these

Never reach into `@supabase/supabase-js` or `@supabase/ssr` directly outside the `src/utils/supabase/` directory. Use:

| File | When |
|---|---|
| [`src/utils/supabase/client.ts`](src/utils/supabase/client.ts) | Browser code. Exports `createClient()` (memoized) and `supabase` singleton. |
| [`src/utils/supabase/server.ts`](src/utils/supabase/server.ts) | Server code (route handlers, Server Actions, RSC). Exports `getServerClient()` (caller-bound, RLS applies), `getServiceClient()` (service role, bypasses RLS — server-only), `getServerAccessToken()`. |
| [`src/utils/supabase/middleware.ts`](src/utils/supabase/middleware.ts) | Next.js middleware only. |
| [`src/utils/supabase/with-retry.ts`](src/utils/supabase/with-retry.ts) | Wrap any PostgREST call that runs against a flaky backend (502/503/504 + `schema cache`/`recovery mode`/`bad gateway` retried 4× with backoff). |
| [`src/utils/supabase/realtime.ts`](src/utils/supabase/realtime.ts) | `subscribeToTable()`, `subscribeToBroadcast()`, `publishBroadcast()`, `unsubscribe()`, `disconnectRealtime()`. |

### `.maybeSingle()` vs `.single()`

Use `.maybeSingle()` when a row may legitimately be missing — `.single()` returns HTTP 406 for zero rows, which the UI treats as a real error.

## HTTP layer

Do **not** add or use any axios / legacy HTTP client. Anything that cannot be expressed as a direct `@supabase/supabase-js` call from the browser (server-only secrets, token stitching, aggregation, webhooks, OAuth callbacks) goes in **Next.js App Router Route Handlers** under `src/app/api/**/route.ts`:

- File convention: [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- Export named HTTP methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) from `route.ts`. Use `NextRequest` / `NextResponse`.
- Read cookies/headers via `next/headers` (`await cookies()`, `await headers()`).
- On the server, build a Supabase client with `getServerClient()` from `@/utils/supabase/server` so the caller's session is forwarded.
- From the client, call the route with `fetch('/api/...')` — never through a shared axios-style wrapper.

## Realtime — the canonical pattern

**Senders just write rows.** Do not call `.publish()` or any pub/sub method. The DB INSERT IS the broadcast.

```ts
// Sender — server-side or client-side, same pattern
await supabase.from('messages').insert({ conversation_id, sender_id, content });

// Subscriber — anywhere in client code
const channel = subscribeToTable<DbMessageRow>({
  channel: `chat:conv:${convId}`,
  table: 'messages',
  filter: `conversation_id=eq.${convId}`,
  events: ['INSERT'],
  onChange: (payload) => handleIncoming(payload.new),
});
return () => unsubscribe(channel);
```

The only place where `subscribeToBroadcast` / `publishBroadcast` is appropriate is **ephemeral signals that should NOT touch the database** — typing indicators, presence cursors, "user is viewing this post". For anything that has a row, use `subscribeToTable`.

Realtime publication membership is configured per table — currently enabled on `messages`, `comments`, `reactions`, `notifications`, `conversation_participants`, `conversations`. Add new tables via `ALTER PUBLICATION supabase_realtime ADD TABLE public.<name>;`.

## Storage — folder ordering

Storage RLS enforces `(storage.foldername(name))[1] = auth.uid()::text`. The first segment of every uploaded object key MUST be the user's UUID. Sub-folders hang off underneath:

```
<userId>/<file>            ← user-root upload
<userId>/<sub>/<file>      ← optional sub-folder
```

[src/app/api/upload/route.ts](src/app/api/upload/route.ts) enforces this. Don't bypass it.

## Edge functions

Three live in `supabase/functions/`:

- `feed` — paginated post + author feed, JWT-verified, RLS-aware.
- `send-email` — internal Resend wrapper, secret-gated by `EMAIL_WEBHOOK_SECRET`.
- `story-cleanup` — calls `cleanup_expired_stories()` SQL function and removes orphaned storage objects, secret-gated by `CRON_SECRET`.

Deploy via the Supabase MCP `deploy_edge_function` tool or `supabase functions deploy <name>` CLI. Secrets are configured in **Project Settings → Edge Functions → Secrets** or via `supabase secrets set <KEY>=<value>`.

## Stack and conventions

- **Package manager**: `pnpm` (use it for every install, never npm/yarn).
- **Tailwind**: 3.4 (do NOT upgrade to v4). Lock the version in `package.json`.
- **State**: Zustand for client stores. TanStack Query is in the codebase but Devtools were removed — don't re-add the floating devtools.
- **Tests**: there is no test runner configured yet. UI changes must be hand-verified in a browser; type-checking + production build are the gating signals (`npx tsc --noEmit` then `pnpm build`).
- **Email**: `RESEND_API_KEY` is server-only — never prefix it `NEXT_PUBLIC_*`. Mirror in `.env.example` with a placeholder.

## Layout

```
src/
  app/                    # Next.js App Router (UI + route handlers)
    api/**/route.ts       # Server-side API surface, Supabase via getServerClient()
    (app)/                # Authenticated app shell
  features/               # Feature modules (auth, chat, profile, friendships, ...)
  components/             # Shared UI components
  utils/supabase/         # The ONLY place that imports from @supabase/*
  lib/                    # Cross-cutting helpers (no Supabase client construction)
supabase/
  functions/<name>/       # Deno edge functions
  migrations/             # SQL migrations applied via Supabase MCP apply_migration
docs/
  legacy/insforge-archive/  # The old InsForge schema + functions, kept for reference
```

## Learned user preferences

- Use `pnpm` for installs and package changes in this repository.
- Email: `RESEND_API_KEY` is server-only.
- TanStack Query Devtools were removed from the app; keep `@tanstack/react-query` for existing data hooks and do not re-add floating devtools unless explicitly requested.
- Tailwind CSS 3.4 — do not upgrade to v4.
