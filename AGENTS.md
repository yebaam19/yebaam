# AGENTS.md

Conventions for AI coding agents (Claude, Cursor, Codex, etc.) working in this repo.

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
