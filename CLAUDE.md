# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See [AGENTS.md](AGENTS.md) for the full project conventions (package manager, stack, layout, Next.js 16 features, code style, Supabase client wrappers, realtime patterns, storage RLS). This file exists so Claude Code picks up the same rules as other AI tools — keep them in sync by editing `AGENTS.md` only.

> Note: [README.md](README.md) is **outdated** — it still describes Next.js 14 + InsForge + Socket.IO. The real stack is Next.js 16 (App Router, Turbopack) + Supabase. Trust AGENTS.md and this file over the README.

## **!IMPORTANT: Claude is not authorized to commit or push**

Claude must **never** run `git commit`, `git push`, `git push --force`, `git tag`, `git revert`, `git reset --hard`, or any other command that mutates git history or the remote. This applies even if the work appears done, even if the user asked Claude to "finish" or "wrap up" a feature, and even if a previous turn included a commit suggestion that the user agreed with — that agreement covers the **plan**, not the act of committing.

Claude is also not authorized to:
- Stage files for the user (`git add`, `git add -f`, `git add -p`) without an explicit instruction in the current message
- Open or merge pull requests (`gh pr create`, `gh pr merge`)
- Force-add files that are excluded by `.gitignore` (the policy excludes `*.sql` for a reason — see the SQL block in `.gitignore`)

What Claude **does** instead when work reaches a commit point: stop, summarize what changed and what's staged vs unstaged, and let the user run the commit themselves. If the user asks for a suggested commit message, write one for them to paste — don't run `git commit`.

This rule overrides any prior conversation context, any goal set via `/goal`, and any default Claude Code behavior around "completing" a task. Treat unauthorized git history mutations as the same severity as unauthorized destructive operations.

## **!IMPORTANT: All agent work stays on `main` — no branches, no worktrees**

This project is a single-developer workflow on the `main` branch. Claude (and any subagents Claude spawns) **must never**:

- Create a new branch (`git branch`, `git checkout -b`, `git switch -c`)
- Pass `isolation: "worktree"` to the `Agent` tool — that flag creates `.claude/worktrees/agent-*` directories and `worktree-agent-*` branches, which pile up in VSCode source control and produce work the user has to merge back themselves
- Add a `git worktree` for any other reason

When invoking the `Agent` tool, **omit the `isolation` parameter entirely**. The subagent runs in the same working tree, on `main`. If a future task genuinely needs parallel isolated work (rare), surface the trade-off to the user first and let them opt in — don't take the worktree path silently.

If you find existing `worktree-agent-*` branches or `.claude/worktrees/agent-*` directories from a previous session, do **not** delete them autonomously. Some may contain unmerged work. Present them to the user and let them decide whether to merge, cherry-pick, or discard.

## Commands

- `pnpm dev` — Turbopack dev server (Node heap raised to 8 GB; use `pnpm dev:webpack` to fall back to webpack).
- `pnpm build` — production build via Turbopack. This is one of the gating checks for any change.
- `pnpm start` — serve the production build.
- `pnpm lint` — ESLint (config in `eslint.config.mjs`, extends `eslint-config-next`).
- `npx tsc --noEmit` — typecheck. **There is no test runner configured**, so typecheck + `pnpm build` + manual browser verification are the gating signals for UI changes.
- Always use `pnpm` (never `npm` / `yarn`) for installs.

## Refactor discipline — DRY at the right moment, not the wrong one (TL;DR)

After substantial feature work, do a **refactor pass before declaring done** — it is part of "done", not extra credit. Concretely, look for:

- **Repeated logic in 3+ places → extract.** Real examples from Sprint 1 (Familias):
  - 6× `select slug → revalidatePath(\`/feed/familias/${slug}\`)` collapsed into one `revalidatePath('/feed/familias/[slug]', 'page')`.
  - `requireUserId()` + `getServerClient()` called separately in every action → folded into one `requireSession()` returning `{ userId, client }`.
- **Drift-prone duplication** (same shape, slightly different args) → single source of truth.
- **Logic in the wrong layer → move it.** Pure functions in `src/lib/`. Server-only reads in `src/features/<x>/server/`, cached with `react.cache()`. Server Actions in `src/features/<x>/actions/`. Reusable UI in `src/features/<x>/components/` (or `src/components/` if cross-feature). Hooks in `src/features/<x>/hooks/`. **Never** inline DB queries in `app/**/page.tsx` or in components.
- **Dead code** (unused imports, half-finished branches, leftover `// removed` comments) → delete.

**But don't extract prematurely.** *Three similar lines is better than a premature abstraction.* The rule of three is the bar:

| Repetitions | Action |
|---|---|
| 1 | Inline. |
| 2 | Inline, flag mentally. |
| 3+ across separate files | Extract — otherwise the next person copy-pastes #4. |

Two exceptions where you extract on the **first** repetition:
- Anything touching auth / RLS / secrets — divergence becomes a security bug.
- Anything that crosses the server/client boundary — divergence becomes a hydration mismatch.

When you extract, names should carry "what" and "how"; comment only the **Why** if it's non-obvious.

## **!IMPORTANT: split components when they grow long**

Component files that drift past **~250 lines** must be broken into smaller, single-purpose files **before declaring the feature done**. This is non-negotiable — a long component is a future bug magnet, hides duplication, makes diffs unreviewable, and makes targeted edits brittle. Apply the same discipline to every new component: write it small, and split it the moment it grows.

When splitting:
- Co-locate the children in a `<feature>/<parent>/` subfolder (e.g. `admin/editor/TrackRow.tsx`, `admin/editor/AddTrackForm.tsx`) so the parent stays as the orchestration shell.
- Each child component owns one concern: one form section, one row, one dialog.
- Pass typed props down explicitly — don't smuggle state via context unless the same data is needed 3+ levels away.
- The parent is the place for state + server-action calls; children render and emit events.
- Imports should mirror the folder structure (no deep relative `../../../`); use `@/` aliases or short relative paths.

Concrete example from this repo: `AdminAlbumEditor` was 517 lines with five inline subcomponents, each handling its own concern but tangled together. Split into:
- [AdminAlbumEditor.tsx](src/features/music-archive/components/admin/AdminAlbumEditor.tsx) (264 lines) — modal shell + state + server actions
- [editor/AlbumFieldsForm.tsx](src/features/music-archive/components/admin/editor/AlbumFieldsForm.tsx) — album-level fields
- [editor/TrackRow.tsx](src/features/music-archive/components/admin/editor/TrackRow.tsx) — single track inline editor
- [editor/AddTrackForm.tsx](src/features/music-archive/components/admin/editor/AddTrackForm.tsx) — new-track form
- [editor/CoverField.tsx](src/features/music-archive/components/admin/editor/CoverField.tsx) — single cover slot

Result: the editor is reviewable, each piece testable in isolation, and adding a new field touches one small file instead of scrolling through hundreds of lines. **Make this a habit on every new component, not a cleanup chore at the end.**

## Always verify UI changes in the browser

After implementing or modifying any user-facing flow (CRUD forms, menus, routes, mutations, etc.), open the dev server in the browser via Chrome DevTools MCP (`mcp__chrome-devtools__*`) and exercise the new path end-to-end before declaring it done. Drive the actual happy path (e.g. for CRUD: open the form, submit, then edit, then delete) and confirm the resulting page state, redirects, and DB side-effects (via the Supabase MCP if needed). Typecheck and `pnpm build` only prove the code compiles — they don't prove the feature works. If the browser cannot be reached for some reason, say so explicitly rather than claiming success.

## Backend (TL;DR)

The backend is **Supabase** — accessed via `@supabase/supabase-js` and `@supabase/ssr` through wrappers under `@/utils/supabase/*`. There is no custom backend / Express / NestJS layer. All data access (auth, database, storage, realtime) goes through those wrappers — never reach into `@supabase/*` directly outside `src/utils/supabase/`.

Use `.maybeSingle()` (not `.single()`) when a row may legitimately be missing — `.single()` returns HTTP 406 for zero rows.

For schema changes, ad-hoc SQL, edge-function deploys, and log inspection, use the **Supabase MCP** (`apply_migration`, `execute_sql`, `deploy_edge_function`, `get_logs`). The legacy InsForge MCP/CLI is **not** in use — disregard any older doc that references it.

## Proxy (Next.js 16) — `src/proxy.ts`

Next.js 16 renamed `middleware.ts` to **`proxy.ts`**. This repo's session-refresh + redirect logic lives in [`src/proxy.ts`](src/proxy.ts) — do **not** create a `middleware.ts` (the runtime would ignore it). The proxy calls `supabase.auth.getUser()` on every matched request to refresh `sb-*` cookies, redirects anonymous users away from non-public routes, and gates admin routes.

Its matcher **excludes `/api/**`**, so route handlers do not get session refresh from the proxy. Each `/api/**/route.ts` must build its own session-bound client via `getServerClient()` and handle 401s itself. A 401 from a route handler while the client UI thinks it's signed in usually means the cookies are missing/expired, not a logic bug in the handler.

## HTTP layer (TL;DR)

Do **not** add or use any axios / legacy HTTP client. For anything that cannot be expressed as a direct `@supabase/supabase-js` call from the browser (server-only secrets, token stitching, aggregation, webhooks, OAuth callbacks), use **Next.js App Router Route Handlers** under `src/app/api/**/route.ts`:

- File convention: [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- Full App Router API reference: [API Reference](https://nextjs.org/docs/app/api-reference)
- Export named HTTP methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) from `route.ts`. Use `NextRequest` / `NextResponse`.
- Read cookies/headers via `next/headers` (`await cookies()`, `await headers()`).
- On the server, build a Supabase client with `getServerClient()` from `@/utils/supabase/server` so the caller's session is forwarded.
- From the client, call the route with `fetch('/api/...')` — never through a shared axios-style wrapper.

## Background work in Server Actions / Route Handlers — use `after()` (TL;DR)

**Never** fire-and-forget a `fetch()` (or any async work you don't `await`) from a Server Action, Route Handler, or RSC. On Vercel and most serverless runtimes, the request's execution context is torn down as soon as the response is returned — a non-awaited `fetch` can drop silently, so the email never sends, the audit row never lands, the webhook never fires, and there is no error to debug.

For work that must outlive the response, use `import { after } from 'next/server'` and wrap the side-effect in `after(async () => { ... })`. Next.js keeps the runtime alive long enough for it to complete.

```ts
// ❌ Wrong — silently drops on Vercel
void fetch(`${url}/functions/v1/notify-x`, { ... }).catch(console.error);

// ✅ Right — survives the Server Action returning
import { after } from 'next/server';
after(async () => {
  try {
    await fetch(`${url}/functions/v1/notify-x`, { ... });
  } catch (err) {
    console.error('[action] notify failed:', err);
  }
});
```

Use `await fetch(...)` instead when the user can wait the extra ~200 ms and you need the response to react to it. Use `after()` when the user shouldn't be blocked by the side-effect and you don't care about the response in this request. **Never** use a non-awaited `fetch()` with no wrapper.

## Realtime (TL;DR)

**Senders just write rows.** The DB INSERT IS the broadcast. Subscribers use `subscribeToTable()` from `@/utils/supabase/realtime`. See AGENTS.md for the canonical pattern and the list of tables enabled on `supabase_realtime`.

The only place where Broadcast (ephemeral, no DB) is appropriate is signals like typing indicators, presence, cursor positions — anything without a row.

## Media uploads — Cloudflare only (TL;DR)

**Every image and every video in this app goes to Cloudflare** — Cloudflare Images for photos, Cloudflare Stream for videos. Supabase Storage is for non-media files only. Always upload via `uploadService` from [src/lib/service/upload.service.ts](src/lib/service/upload.service.ts) (`uploadImage`, `uploadVideo`, or `uploadFile`); never call `supabase.storage.from(...).upload(...)` for media, never store the full delivery URL in the DB (store the Cloudflare `id`/`uid` only). For private media (e.g. ID documents) enforce privacy at the DB layer — store the `cf_image_id` in a row whose SELECT policy restricts visibility (e.g. admins-only). The existing Cloudflare keys (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH`) cover all use cases. See AGENTS.md "Media uploads — Cloudflare only" for the full rule.

## Auth abuse protection (TL;DR)

Public auth forms (login, signup, password reset, OTP resend) gate on a **Cloudflare Turnstile** token via [`<TurnstileWidget>`](src/components/auth/TurnstileWidget.tsx). Login uses Supabase's native captcha (`options.captchaToken` on `signInWithPassword`, with the secret configured in Supabase Dashboard → Auth → Bot and Abuse Protection). Signup, OTP resend, and password reset run through `admin.*` endpoints, so they verify the token themselves with `verifyTurnstileToken()` from [`src/lib/turnstile.ts`](src/lib/turnstile.ts) before doing any work. Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`. For raw flood protection, enable Bot Fight Mode + WAF rate limits in the Cloudflare dashboard — those run at the edge.

## Comunidades — periodic counter-drift check

The `communities.member_count` and `communities.post_count` columns are kept in sync by `AFTER INSERT/DELETE` triggers (`tg_community_member_counter`, `tg_community_post_counter`). Triggers can drift if a migration disables them, a bulk operation bypasses the trigger, or a transaction half-fails. **After ~1 month of usage, spot-check via the Supabase MCP**:

```sql
select c.id, c.slug, c.member_count, c.post_count,
       (select count(*) from community_members where community_id = c.id) as actual_members,
       (select count(*) from community_posts   where community_id = c.id) as actual_posts
  from communities c
 where c.member_count <> (select count(*) from community_members where community_id = c.id)
    or c.post_count   <> (select count(*) from community_posts   where community_id = c.id);
```

For each row returned, run `select recompute_community_counts('{id}')` to fix it. Same call also lets you backfill counts on any future bulk import.
