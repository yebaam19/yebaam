# AGENTS.md

Conventions for AI coding agents (Claude, Cursor, Codex, etc.) working in this repo.

## Backend: InsForge only

**The custom backend is being removed. All backend functionality must go through InsForge (`@insforge/sdk`).**

- Do **not** add or keep `axios` calls to `/api/auth/*` or any other custom backend endpoints — they no longer exist and will throw `Network Error`.
- Use the InsForge SDK for auth, database, storage, edge functions, realtime, AI features.
- When you find legacy code calling the old backend (e.g. `AuthService` in [src/features/auth/services/auth.service.ts](src/features/auth/services/auth.service.ts)), migrate it to InsForge rather than patching the axios call.
- See the `insforge`, `insforge-cli`, `insforge-debug`, and `insforge-integrations` skills for SDK + infra usage.

## HTTP layer: no axios, no legacy client

`src/lib/legacy-api/client.ts` is **deprecated and being removed**. Do not import `getAxiosInstance`, `initAxios`, `setTokenProvider`, or any other export from `@/lib/legacy-api/*` in new code. Every remaining caller must be migrated.

For anything that cannot be expressed as a direct `@insforge/sdk` call from the browser (server-only secrets, token stitching, aggregation, webhooks, OAuth callbacks), use **Next.js App Router Route Handlers** under `src/app/api/**/route.ts`:

- File convention: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Full App Router API reference: https://nextjs.org/docs/app/api-reference
- Export named HTTP methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) from `route.ts`. Use `NextRequest` / `NextResponse`.
- Read cookies/headers via `next/headers` (`await cookies()`, `await headers()`).
- On the server, build an InsForge client with `getServerClient()` from `@/lib/insforge/server` so the caller's access token is forwarded.
- From the client, call the route with `fetch('/api/...')` — never through a shared axios-style wrapper.

**Decision rule**: if a browser-side feature can talk to InsForge directly via `@insforge/sdk`, do that. Only add a Route Handler when the server is actually needed (secrets, cookie-only token handling, cross-table stitching, third-party webhooks).

## Stack

- **Next.js 16** (App Router, Turbopack default for dev + build)
- **React 19.2**
- **TypeScript 6** (strict mode)
- **Tailwind CSS v4**
- **ESLint 9** (flat config — `eslint.config.mjs`)
- **pnpm** as the package manager

## Package manager

**Always use `pnpm`.** Never run `npm` or `yarn` commands in this repo.

```bash
pnpm install         # install dependencies
pnpm add <pkg>       # add a runtime dep
pnpm add -D <pkg>    # add a dev dep
pnpm remove <pkg>    # remove a dep
pnpm dev             # start dev server (Turbopack)
pnpm build           # production build (Turbopack)
pnpm start           # serve production build
pnpm lint            # run ESLint
```

The only lockfile is `pnpm-lock.yaml`. Do not create or commit `package-lock.json` or `yarn.lock`.

## Project layout

- `src/app/` — App Router routes, layouts, server components
- `src/components/` — shared UI components
- Path alias: `@/*` → `src/*`

## Next.js 16 features in use

- **Turbopack** — default dev + build bundler
- **Typed routes** — `experimental.typedRoutes` enabled, use typed `<Link href>` where possible
- **App Router** — server components by default; add `'use client'` only when necessary
- **Server Actions** — prefer over custom API routes for mutations from client components

When adding caching, prefer the `'use cache'` directive over the legacy `unstable_cache` API.

## Data fetching architecture (App Router)

The goal is not just "reduce API calls" — it is **avoid needing API routes in the first place** whenever the browser does not strictly need one. Apply these rules in order:

1. **Fetch on the server, not the client.** Do reads in Server Components with `getServerClient()` from `@/lib/insforge/server`. Do not `useEffect(() => fetch('/api/...'))` for data that the page already knows it needs.
2. **Server Components are the data layer.** Replace `Client → /api/route → InsForge` with `Server Component → InsForge`. Skip the HTTP hop.
3. **Route Handlers only when the server is actually needed** — server-only secrets, cookie/token stitching, webhooks, OAuth callbacks, cross-source aggregation. Pure reads that just proxy InsForge should be deleted, not kept.
4. **Mutations = Server Actions**, not POST route handlers. Call them directly from `<form action={...}>` or client handlers; follow with `revalidatePath` / `revalidateTag`.
5. **Cache by default.** For `fetch(...)` use `next: { revalidate: N }`; avoid `cache: 'no-store'` unless truly dynamic. For InsForge SDK calls (not `fetch`), wrap with `'use cache'` — the fetch cache directives do not apply to SDK calls.
6. **Parallelize, do not chain.** Use `Promise.all` in Server Components to kill waterfalls.
7. **Split with `<Suspense>` boundaries** per section (e.g. product / reviews / recommendations) so slow sections stream independently instead of blocking the page.
8. **Co-locate fetching** next to the route that uses it (`app/clubs/page.tsx`, `app/clubs/[id]/page.tsx`) — no global "data services" that over-fetch.
9. **Revalidate on-demand** (`revalidatePath`, `revalidateTag`) after mutations; prefer that over short `revalidate` windows.
10. **Client-side fetching is the last resort** — only for real-time, user-driven, or highly interactive pieces. When used, debounce inputs and prefer SWR/React Query over raw `useEffect` + `fetch`.

### Decision flow for any new data read

```
Can a Server Component read it via getServerClient()?       → do that
Does the browser need live/interactive updates?             → client + SWR (debounced)
Does it need server-only secrets or token stitching?        → Route Handler
Is it a mutation?                                           → Server Action
```

### Debouncing, rate limiting, caching, Suspense

These four are load-bearing and must be applied together — they solve different layers of the same problem (too many calls, too expensive calls, too slow calls).

**Debouncing (client → server call volume)**
- Any input that triggers a request (search box, filter, autocomplete, "live preview") must debounce — 300ms default, 500ms for expensive queries.
- Prefer `useDeferredValue` + Suspense for in-render filtering, and a debounced effect only when a network call is actually needed.
- Cancel in-flight requests on new input (`AbortController`) so stale responses can't overwrite fresh ones.
- Never debounce a mutation — debounce the *input*, not the submit.

**Rate limiting (server → abuse + cost control)**
- Every Route Handler that accepts unauthenticated or user-triggered input (auth, search, upload, webhooks, AI calls) must rate-limit by IP and/or user id. No exceptions for "internal" endpoints — the browser is not internal.
- Return `429` with `Retry-After` on limit; do not silently drop.
- Mutations via Server Actions also need a limiter when they hit paid APIs (AI, email, SMS, storage writes).
- Keep limits centralized — one helper, not ad-hoc counters per route.

**Caching (reduce repeat work)**
- Server Components: `fetch` uses `next: { revalidate: N }` by default; `cache: 'no-store'` only when truly per-request dynamic.
- InsForge SDK reads: wrap with `'use cache'` and tag them so `revalidateTag` can invalidate after mutations. The Next `fetch` cache does NOT apply to SDK calls.
- Client: SWR / React Query with a sane `staleTime` — never `staleTime: 0` on list/detail views.
- Full Route Cache: if a page has no per-request data, let it be fully static. Don't sprinkle `cookies()` / `headers()` calls that force dynamic rendering unless needed.
- Invalidate on write with `revalidatePath` / `revalidateTag`, not by shortening `revalidate` windows.

**React Suspense (perceived latency + waterfalls)**
- Wrap each independent data section in its own `<Suspense fallback={<Skeleton />}>` so slow sections stream in without blocking the rest of the page.
- Kick off parallel fetches at the top of a Server Component (don't `await` them) and pass the promises to children that `use()` them — this unlocks streaming + parallelism.
- Pair every Suspense boundary with an `error.tsx` / ErrorBoundary sibling — a failed section should not blank the page.
- Loading UI lives in `loading.tsx` at the route level for full-page fallbacks; inline `<Suspense>` for section-level.

### Anti-patterns to refactor on sight

- `useEffect` + `fetch('/api/...')` to load initial page data.
- Route handlers that only forward a request to InsForge with no added server logic.
- Sequential `await` chains in Server Components where `Promise.all` would work.
- One giant Suspense wrapping the whole page instead of section-level boundaries.
- Client components importing data-fetching helpers that could run on the server.

## Code conventions

- Server components by default; only opt into client with `'use client'`
- Use the `@/*` alias for imports from `src/`
- Don't add comments explaining what code does — only non-obvious *why*
- Don't introduce new abstractions or "just in case" error handling
- Match existing file and component naming patterns before inventing new ones

## Config files — do not revert

- `next.config.ts` (TypeScript config, not `.mjs`)
- `eslint.config.mjs` (flat config, not `.eslintrc.json`)
- `tsconfig.json` targets `ES2022` with `moduleDetection: force`

## Build tolerance

`next.config.ts` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to `true` so production builds never fail on lint/type errors. This is intentional for deploy reliability — do not remove without discussing with the team. Still fix errors locally via `pnpm lint` and `tsc --noEmit`.

## Learned User Preferences

- Keep InsForge SQL migration files out of the shared repo for security; `insforge/migrations/*.sql` is gitignored—share SQL through InsForge or other private channels instead of committing it.
- Use server-only `RESEND_API_KEY` for Resend (never a `NEXT_PUBLIC_` variable).

## Learned Workspace Facts

- `terraform/` holds AWS-oriented deployment IaC (Amplify-related); see `terraform/README.md` for workflow. Application backend behavior is InsForge per the sections above.
- Primary GitHub remote for this codebase is `https://github.com/yebaam19/yebaam` (confirm `git remote -v` and credentials before pushing).
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_URL_DEV`, and `NEXT_PUBLIC_API_URL_DEV` are read in `src/config/featureFlags.ts`; include them in `.env.example` when documenting env vars.
- `NEXT_PUBLIC_BACKEND_URL` may appear in Next env and infra config even when nothing under `src/` reads it directly.
