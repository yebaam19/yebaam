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
