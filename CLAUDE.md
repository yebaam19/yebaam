# CLAUDE.md

See [AGENTS.md](AGENTS.md) for all project conventions (package manager, stack, layout, Next.js 16 features, code style).

This file exists so Claude Code picks up the same rules as other AI tools. All guidance lives in `AGENTS.md` — keep them in sync by editing `AGENTS.md` only.

## Backend
The backend is **InsForge** — accessed via `@insforge/sdk` through `@/lib/insforge/client`. There is no custom backend / Express / NestJS layer. All data access (auth, database, storage) goes through the InsForge SDK. Use `.maybeSingle()` (not `.single()`) when a row may legitimately be missing — `.single()` returns HTTP 406 for zero rows.

## HTTP layer
Do **not** add or use any axios / legacy HTTP client. `src/lib/legacy-api/client.ts` is deprecated and being removed — do not import `getAxiosInstance`, `initAxios`, `setTokenProvider`, or anything from `@/lib/legacy-api/*` in new code, and migrate existing callers off it.

For anything that cannot be expressed as a direct `@insforge/sdk` call from the browser (server-only secrets, token stitching, aggregation, webhooks, OAuth callbacks), use **Next.js App Router Route Handlers** under `src/app/api/**/route.ts`:

- File convention: [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- Full App Router API reference: [API Reference](https://nextjs.org/docs/app/api-reference)
- Export named HTTP methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) from `route.ts`. Use `NextRequest` / `NextResponse`.
- Read cookies/headers via `next/headers` (`await cookies()`, `await headers()`).
- On the server, build an InsForge client with `getServerClient()` from `@/lib/insforge/server` so the caller's access token is forwarded.
- From the client, call the route with `fetch('/api/...')` — never through a shared axios-style wrapper.
