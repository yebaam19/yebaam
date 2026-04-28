# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See [AGENTS.md](AGENTS.md) for the full project conventions (package manager, stack, layout, Next.js 16 features, code style, Supabase client wrappers, realtime patterns, storage RLS). This file exists so Claude Code picks up the same rules as other AI tools — keep them in sync by editing `AGENTS.md` only.

> Note: [README.md](README.md) is **outdated** — it still describes Next.js 14 + InsForge + Socket.IO. The real stack is Next.js 16 (App Router, Turbopack) + Supabase. Trust AGENTS.md and this file over the README.

## Commands

- `pnpm dev` — Turbopack dev server (Node heap raised to 8 GB; use `pnpm dev:webpack` to fall back to webpack).
- `pnpm build` — production build via Turbopack. This is one of the gating checks for any change.
- `pnpm start` — serve the production build.
- `pnpm lint` — ESLint (config in `eslint.config.mjs`, extends `eslint-config-next`).
- `npx tsc --noEmit` — typecheck. **There is no test runner configured**, so typecheck + `pnpm build` + manual browser verification are the gating signals for UI changes.
- Always use `pnpm` (never `npm` / `yarn`) for installs.

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

## Media uploads — Cloudflare only (TL;DR)

**Every image and every video in this app goes to Cloudflare** — Cloudflare Images for photos, Cloudflare Stream for videos. Supabase Storage is for non-media files only. Always upload via `uploadService` from [src/lib/service/upload.service.ts](src/lib/service/upload.service.ts) (`uploadImage`, `uploadVideo`, or `uploadFile`); never call `supabase.storage.from(...).upload(...)` for media, never store the full delivery URL in the DB (store the Cloudflare `id`/`uid` only). For private media (e.g. ID documents) enforce privacy at the DB layer — store the `cf_image_id` in a row whose SELECT policy restricts visibility (e.g. admins-only). The existing Cloudflare keys (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH`) cover all use cases. See AGENTS.md "Media uploads — Cloudflare only" for the full rule.
