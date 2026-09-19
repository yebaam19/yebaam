---
description: Project conventions for the Next.js 16 + Supabase app
globs: *
alwaysApply: true
---

# Project conventions

This is a Next.js 16 (App Router, Turbopack) social app backed by **Supabase** for database, auth, storage, realtime, and edge functions. The frontend ships TypeScript only — no axios, no jQuery, no legacy HTTP wrappers.

## Git workflow: single branch (`main`), no agent worktrees

This repo is a solo workflow on `main`. AI agents (Claude Code, Cursor, Windsurf, Copilot, etc.) and any subagents they spawn **must never**:

- Create new branches (`git branch`, `git checkout -b`, `git switch -c`)
- Use git worktrees (`git worktree add`) or pass `isolation: "worktree"` when invoking subagents — that flag creates `.claude/worktrees/agent-*` directories and `worktree-agent-*` branches that pile up in source control
- Run `git commit`, `git push`, `git tag`, `git revert`, `git reset --hard`, or any other history-mutating command. Agents prepare changes; the human commits.

All agent work lands as edits in the existing working tree on `main`. If a task genuinely benefits from isolated parallel work (rare), surface it and let the human opt in — don't take the worktree path silently. If existing `worktree-agent-*` branches or `.claude/worktrees/agent-*` directories are present from a previous session, do not delete them autonomously — some may contain unmerged work; surface them and let the human decide.

## Backend: Supabase

- **Database**: Postgres + PostgREST, accessed via `@supabase/supabase-js`.
- **Auth**: `@supabase/ssr` for cookie-managed sessions across server + client.
- **Storage**: `supabase.storage.from(bucket)` is for **non-media files only**. All images and videos live on **Cloudflare** (Cloudflare Images + Cloudflare Stream) — see "Media uploads — Cloudflare only" below. The legacy buckets (`avatars`, `covers`, `posts`, `profile-photos`, `profile-videos`, `stories`) are not the source of truth for media; do not write new media there.
- **Realtime**: `postgres_changes` on tables (the canonical pattern — write a row, every subscriber gets it for free) plus Broadcast channels for ephemeral signals like typing indicators. Both wrapped by [src/utils/supabase/realtime.ts](src/utils/supabase/realtime.ts).
- **Edge Functions**: live under `supabase/functions/<name>/index.ts`. The repository currently contains `feed`, `send-email`, `story-cleanup`, `notify-verification-submitted`, `notify-family-invitation`, and `notify-music-track-upload`.

## Client wrappers — always import from these

Never reach into `@supabase/supabase-js` or `@supabase/ssr` directly outside the `src/utils/supabase/` directory. Use:

| File | When |
|---|---|
| [`src/utils/supabase/client.ts`](src/utils/supabase/client.ts) | Browser code. Exports `createClient()` (memoized) and `supabase` singleton. |
| [`src/utils/supabase/server.ts`](src/utils/supabase/server.ts) | Server code (route handlers, Server Actions, RSC). Exports `getServerClient()` (caller-bound, RLS applies), `getServiceClient()` (service role, bypasses RLS — server-only), `getServerAccessToken()`. |
| [`src/utils/supabase/middleware.ts`](src/utils/supabase/middleware.ts) | Used by `src/proxy.ts` (Next.js 16 proxy — see below). Do not import from app code. |
| [`src/utils/supabase/with-retry.ts`](src/utils/supabase/with-retry.ts) | Wrap any PostgREST call that runs against a flaky backend (502/503/504 + `schema cache`/`recovery mode`/`bad gateway` retried 4× with backoff). |
| [`src/utils/supabase/realtime.ts`](src/utils/supabase/realtime.ts) | `subscribeToTable()`, `subscribeToBroadcast()`, `publishBroadcast()`, `unsubscribe()`, `disconnectRealtime()`. |

### `.maybeSingle()` vs `.single()`

Use `.maybeSingle()` when a row may legitimately be missing — `.single()` returns HTTP 406 for zero rows, which the UI treats as a real error.

## Proxy (Next.js 16) — `src/proxy.ts`

Next.js 16 renamed `middleware.ts` to **`proxy.ts`** at the project root. This repo uses [`src/proxy.ts`](src/proxy.ts) — it is the canonical place for session refresh, redirect rules, and admin gating. Do **not** create a `middleware.ts`; the runtime expects `proxy.ts` and would silently ignore the old name.

What it does:
- Calls `supabase.auth.getUser()` on every matched request, which refreshes the `sb-*` cookies if the access token is near expiry.
- Clears stale auth cookies on `invalid_refresh_token` / `refresh_token_not_found`.
- Redirects unauthenticated users away from non-public routes and routes platform admins to `/admin/foros`.
- Returns `client.supabaseResponse` so refreshed cookies are written back.

The `config.matcher` excludes `api`, `_next/*`, and static assets — so **API route handlers do not pass through the proxy**. Each route handler must therefore build its own session-bound client via `getServerClient()` (which reads the same cookies) and handle the unauthenticated case explicitly. If you add a new auth-gated `/api/**/route.ts`, do not assume the proxy has already validated the session for you.

When the user lands on the app fresh, the first navigated page goes through `proxy.ts` and the session cookies get re-minted — that's why GET conversations works but a POST done immediately after a long idle period can still race. If you see a 401 from a route handler while the client thinks it is signed in, the cookies are missing or expired, not the route logic.

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

## Media uploads — Cloudflare only (HARD RULE)

**Every image and every video in this app — without exception — is stored on Cloudflare.** Images go to **Cloudflare Images**, videos go to **Cloudflare Stream**. Supabase Storage is for non-media files only (see "Storage — folder ordering" below).

All uploads MUST go through `uploadService` ([src/lib/service/upload.service.ts](src/lib/service/upload.service.ts)):
- `uploadService.uploadImage(file)` → Cloudflare Images via `/api/upload/image-url` → returns `{ id, url }` where `url = https://imagedelivery.net/{NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/{id}/public`.
- `uploadService.uploadVideo(file)` → Cloudflare Stream via `/api/upload/video-url` → polls `/api/upload/video-status/[uid]` until `readyToStream`, then returns `{ uid, duration, thumbnail }`.
- `uploadService.uploadAudio(file)` → Cloudflare R2 via `/api/upload/audio-url` (presigned PUT with the declared size bound into the signature; retries once with a fresh URL) → returns `{ key, durationSeconds }`.
- `uploadService.uploadFile(file)` dispatches to image or video based on MIME.

**Enforced by lint** (`eslint.config.mjs`): `supabase.storage.from(...).upload(...)` and `new XMLHttpRequest()` are ESLint **errors** everywhere except `upload.service.ts` itself. If the rule fires on you, you are building an upload path in the wrong place — route it through `uploadService`.

**Documents (PDFs and other non-media user files)** also belong on Cloudflare — on **R2**, following the same presigned-PUT pattern as audio (auth + MIME allowlist + size cap in the signing route). Store the R2 `key` in the DB (e.g. `cv_cf_file_id`) and serve it via a short-TTL presigned GET.

Direct-upload signing helpers live in [src/lib/cloudflare/images.ts](src/lib/cloudflare/images.ts) and [src/lib/cloudflare/stream.ts](src/lib/cloudflare/stream.ts) — these are the only places that talk to the Cloudflare API. Persist the Cloudflare `id` / `uid` in your DB; never persist a delivery URL — derive it from the id at render time.

**Private images** (e.g. ID documents, KYC photos): enforce privacy at the **DB layer** with RLS — store the `cf_image_id` in a row whose SELECT policy restricts visibility to the authorized audience (admins, the owner, etc.). The id itself is unguessable, so non-authorized users can never discover a viewable URL. Do not introduce HMAC-signed delivery URLs unless the existing keys cover it.

**Required env**: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH`. No additional Cloudflare keys are needed for private uploads — RLS does the gating.

Do NOT:
- call `supabase.storage.from(...).upload(...)` for any image or video
- introduce new presigned-S3-URL flows (`PUT` to S3 with a signed URL)
- add new media buckets to Supabase Storage
- store full Cloudflare delivery URLs in the database — store the `id`/`uid` only

The only legitimate non-Cloudflare media destination is the chat-attachment stub ([src/features/chat/hooks/useUploadChatMedia.ts](src/features/chat/hooks/useUploadChatMedia.ts)), which currently throws and is awaiting a backend implementation. When that lands, it must use `uploadService` per this rule.

## Storage — folder ordering (non-media files)

For non-media files only — Storage RLS enforces `(storage.foldername(name))[1] = auth.uid()::text`. The first segment of every uploaded object key MUST be the user's UUID. Sub-folders hang off underneath:

```
<userId>/<file>            ← user-root upload
<userId>/<sub>/<file>      ← optional sub-folder
```

## Edge functions

Edge Functions currently in `supabase/functions/`:

- `feed` — paginated post + author feed, JWT-verified, RLS-aware.
- `send-email` — internal Resend wrapper, secret-gated by `EMAIL_WEBHOOK_SECRET`.
- `story-cleanup` — calls `cleanup_expired_stories()` SQL function and removes orphaned storage objects, secret-gated by `CRON_SECRET`.
- `notify-verification-submitted` — notifies admins when a verification request is submitted.
- `notify-family-invitation` — sends rate-limited family invitation notifications.
- `notify-music-track-upload` — notifies the relevant audience about music track uploads.

Deploy via the Supabase MCP `deploy_edge_function` tool or `supabase functions deploy <name>` CLI. Secrets are configured in **Project Settings → Edge Functions → Secrets** or via `supabase secrets set <KEY>=<value>`.

## Auth abuse protection — Cloudflare Turnstile

All public auth surfaces (login, signup, password reset, OTP resend) MUST render a **Cloudflare Turnstile** widget and gate the request on a verified token. The integration uses two paths because some auth flows go through the regular Supabase auth API and others use the service-role admin API:

| Flow | Verification path |
|---|---|
| `signInWithPassword` (login) | Supabase native CAPTCHA — token is passed in `options.captchaToken` and Supabase verifies it server-side. Configure the Turnstile **secret** in Supabase Dashboard → Authentication → Bot and Abuse Protection. |
| `signupWithOtpAction`, `resendOtpAction`, `requestPasswordResetAction` | Manual server-side verification via [`verifyTurnstileToken()`](src/lib/turnstile.ts). These actions use `admin.*` endpoints which bypass Supabase's CAPTCHA middleware, so we must verify the token ourselves before calling the admin API. |

Client widget: [`<TurnstileWidget>`](src/components/auth/TurnstileWidget.tsx) — wraps `@marsidev/react-turnstile`, exposes a `ref.reset()` so the form can refresh the token after a failed attempt (Turnstile tokens are single-use and expire after ~5 minutes).

Env vars (both required):
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public widget key.
- `TURNSTILE_SECRET_KEY` — server-only secret used by `verifyTurnstileToken()` against `https://challenges.cloudflare.com/turnstile/v0/siteverify`.

When adding a new auth-adjacent action (e.g. invite acceptance, account deletion), follow the same pattern: render `<TurnstileWidget action="...">`, pass `captchaToken` in the action payload, and call `verifyTurnstileToken(captchaToken, { remoteIp, expectedAction })` first thing in the server action.

For volumetric DDoS protection that Turnstile can't address (raw HTTP floods), enable Cloudflare **Bot Fight Mode** and add WAF rate-limit rules per route in the Cloudflare dashboard — those run at the edge before traffic reaches Vercel.

## Feature flag — Club de Coleccionistas (`/musica`)

The entire music-archive module ("Club de Coleccionistas") is behind a build-time kill switch: `NEXT_PUBLIC_MUSIC_CLUB_ENABLED`. Default is enabled (any value other than the literal `'false'` keeps it on).

Set `NEXT_PUBLIC_MUSIC_CLUB_ENABLED=false` and redeploy to:
- Hide the sidebar entries (user + admin nav).
- 404 every route under `/musica/**` and `/admin/music/**` (gated in `src/proxy.ts`).

Use this when legal counsel has not yet cleared catalog distribution, or in any situation where the module needs to disappear from public view. The flag is `NEXT_PUBLIC_*` because it's read both on the server (proxy) and the client (sidebar) — there is no security boundary here; the gate is in the proxy and exists to avoid showing the section in the UI. If we ever need an instant on/off without redeploy, move the flag to a `feature_flags` table and read it per request.

Single source of truth: [`src/config/features-flag.ts`](src/config/features-flag.ts) (`MUSIC_CLUB_ENABLED`). Convenience re-export at [`src/features/music-archive/config.ts`](src/features/music-archive/config.ts) for places where importing the sidebar config would be heavyweight.

## Governance & compliance — binding rules per feature

YEBAAM has a binding legal/governance corpus authored by Jim Oliver Cano Martínez (2026), now transcribed to markdown under [`docs/legal/`](docs/legal/) (the original `.docx`/`.pdf` in `docs/` remain authoritative):

- [`docs/legal/macro-reglamento.md`](docs/legal/macro-reglamento.md) — **superior statute** (16 capítulos, 45 artículos); prevails on conflict.
- [`docs/legal/manual-convivencia.md`](docs/legal/manual-convivencia.md) — operational rulebook that regulates **each feature atomically** (24 artículos).
- [`docs/legal/contrato-usuario.md`](docs/legal/contrato-usuario.md) — the user-facing clickwrap T&C (38 cláusulas).

Hierarchy: **Macro Reglamento › Manual de Convivencia › Contrato de Usuario**.

Three Claude Code subagents under `.claude/agents/` encode these for **build + review** — consult the matching one when touching a feature:

- `manual-convivencia` — per-feature work (Feed, Amigos, Ciudades, Clubes, Comunidades, Blogs, Perfiles, Servicios, Negocios, Chat, food). The day-to-day agent.
- `macro-reglamento` — cross-cutting/architecture (privacy-by-default, Safe Harbor, moderation/sanction engine, ARCO/Derecho al Olvido) and document-conflict tie-breaking.
- `contrato-usuario` — user-facing consent/onboarding, content license, prohibited-content categories, privacy rights.

Recurring invariants these enforce: privacy-by-default at the DB/RLS layer; Safe Harbor (no editorial pre-moderation of UGC); media → Cloudflare or official embed, **never native**; `#Publicidad`/`#Patrocinio` on sponsored content; anti-scraping (lists hidden by default); minors require verifiable parental consent; 24h takedown SLA; progressive sanction ladder; clickwrap consent with a durable evidentiary record. Known code/rule gaps (not yet built) are tracked in [`docs/legal/ENFORCEMENT-GAPS.md`](docs/legal/ENFORCEMENT-GAPS.md).

## Code Review Rules

Review the changed behavior, not only the edited lines. Report a finding only when the change introduces a concrete, reproducible defect or security/compliance regression. Include the affected file and line, explain the user or system impact, and describe the smallest safe correction. Do not report formatting, import ordering, or lint-only issues that CI can enforce. Do not require unrelated cleanup or treat pre-existing problems outside the diff as findings; mention them separately only when they directly block validation of the change.

### Security and authorization

- Flag any authenticated `/api/**` handler that trusts the proxy, cookies, request-supplied user IDs, or `getSession()` without independently verifying the caller. Safe path: use `getServerClient()` plus a verified user lookup and return `401`/`403` explicitly.
- Flag browser-accessible code that imports or exposes service-role credentials, Cloudflare secrets, Resend keys, presigning credentials, or other server-only values. Safe path: keep secrets in server modules or route handlers and expose only the minimum result.
- Flag `getServiceClient()` use for caller-scoped reads or writes unless the code performs an explicit authorization check first. Safe path: prefer the session-bound client so RLS applies; use service role only for a documented privileged operation.
- Flag a new table or privileged operation when RLS, ownership checks, least-privilege grants, or private-by-default policies are missing. Safe path: ship the schema and its policies in the same migration, then verify anonymous, owner, non-owner, and admin behavior.
- Flag public auth or auth-adjacent flows that can execute without a valid, action-bound Turnstile token. Apply the documented native Supabase CAPTCHA or `verifyTurnstileToken()` path as appropriate.

### Data and Supabase

- Flag `.single()` when zero rows are a valid state. Safe path: use `.maybeSingle()` and handle `null` deliberately.
- Flag schema changes made only in application code or against the live database without a checked-in migration. Safe path: add an idempotent migration under `supabase/migrations/` and use the Supabase MCP to apply or inspect it.
- Flag unbounded reads, offset-only pagination on growing feeds, N+1 queries, or filters/orderings on hot paths that lack a supporting index. Safe path: select only needed columns, use bounded/keyset pagination, batch related reads, and add a justified index in a migration.
- Flag write flows that can duplicate state when retried, especially webhooks, invitations, notifications, purchases, and upload finalization. Safe path: use a stable idempotency/uniqueness key and handle conflicts intentionally.
- Flag retries around non-idempotent writes when a repeated attempt can create duplicate side effects. Safe path: retry safe reads or make the write idempotent before applying retry logic.

### Media, realtime, and external effects

- Flag any image/video upload outside `uploadService`, any new Supabase media bucket, or any database write that persists a full Cloudflare delivery URL. Safe path: upload through Cloudflare and persist only the image ID, video UID, or R2 key.
- Flag presigned upload routes that omit authentication, MIME allowlists, size limits bound into the signature, ownership-scoped object keys, or short expirations. Safe path: validate all constraints before signing and derive the object key server-side.
- Flag row-backed events sent through Broadcast or manual publish calls. Safe path: write the row once and subscribe with `subscribeToTable()`; reserve Broadcast for ephemeral signals such as typing and presence.
- Flag email, notification, payment, cleanup, or third-party calls that can leave database state ambiguous after partial failure. Safe path: define an idempotent boundary and record enough state to retry or reconcile safely.

### Product, privacy, and legal behavior

- Flag new public list/search endpoints, realtime subscriptions, or UI disclosures that bypass privacy-by-default, block/mute rules, audience visibility, or anti-scraping constraints. Safe path: enforce visibility in SQL/RLS or a server-side authorization boundary, not only in the UI.
- Flag sponsored content that can render without `#Publicidad`/`#Patrocinio`, minor-facing flows without required consent controls, or moderation/reporting changes that break the documented takedown and sanction process. Safe path: follow the applicable document under `docs/legal/`, using `macro-reglamento.md` when rules conflict.
- Flag destructive account/content actions that omit confirmation, authorization, auditability, or the applicable ARCO/Derecho al Olvido behavior. Safe path: preserve an auditable record while deleting or anonymizing data according to the governing rule.

### Correctness and user experience

- Flag server/client boundary mistakes such as importing server-only modules into Client Components, trusting client validation on the server, or producing hydration-dependent output. Safe path: keep authority on the server and pass serializable, stable props across the boundary.
- Flag changes that leave loading, empty, error, unauthorized, or retry states unusable, or expose an incomplete/mock-backed feature without a `Pronto`/`Próximamente` gate.
- Flag accessibility regressions that block keyboard use, remove an accessible name, break focus management, or make critical status/error feedback unavailable to assistive technology. Safe path: use semantic controls and preserve focus and live feedback.
- Flag missing tests only when the changed logic is high-risk or already covered by an existing test pattern. For UI changes without automated coverage, require a concrete browser verification note; rely on type-check, tests, lint, and production build for mechanical failures.

## Refactor discipline — DRY at the right moment, not the wrong one

Every code file you create or modify must stay at or below **250 lines**; split by responsibility instead of compressing lines. After substantial feature work, do a **refactor pass before declaring done**. It is part of "done", not extra credit. Concretely, look for:

- **Repeated logic in 3+ places → extract.** Real examples from the Familias rollout (Sprint 1):
  - 6× `select slug → revalidatePath(\`/feed/familias/${slug}\`)` collapsed into a single `revalidatePath('/feed/familias/[slug]', 'page')`.
  - `requireUserId()` + `getServerClient()` called separately in every action → folded into one `requireSession()` returning `{ userId, client }`.
- **Drift-prone duplication** (same shape, slightly different args) → single source of truth. If two copies diverge silently, bugs follow.
- **Logic in the wrong layer → move it.** Pure functions in `src/lib/`. Server-only reads in `src/features/<x>/server/`, cached with `react.cache()`. Server Actions in `src/features/<x>/actions/`. Reusable UI in `src/features/<x>/components/` (or `src/components/` if cross-feature). Hooks in `src/features/<x>/hooks/`. **Never** inline DB queries in `app/**/page.tsx` or in components.
- **Dead code**: unused imports, half-finished branches, leftover `// removed` comments → delete.

**But don't extract prematurely.** *Three similar lines is better than a premature abstraction.* The rule of three is the bar:

| Repetitions | Action |
|---|---|
| 1 | Inline. |
| 2 | Inline, flag mentally. |
| 3+ across separate files | Extract — otherwise the next contributor will copy-paste #4. |

Two exceptions where you extract on the **first** repetition:
- Anything touching **auth / RLS / secrets** — divergence becomes a security bug.
- Anything that crosses the **server/client boundary** — divergence becomes a hydration mismatch.

When you extract, names should carry "what" and "how"; comment only the **Why** if it's non-obvious. Mirror this rule in [CLAUDE.md](CLAUDE.md) when editing.

## AI features — TypeSafe

- Use the `$typesafe-ai` skill when a feature needs structured semantic judgment from natural language or application state, including routing, ranking, extraction, verification, scoring, or classification.
- Before implementing a TypeSafe integration, follow the skill and read the relevant live TypeSafe API/SDK, primitive, confidence, and cookbook documentation. Do not invent version-dependent API details.
- Keep deterministic rules, authorization, calculations, exact lookups, workflow execution, and policy enforcement in application code. Keep TypeSafe credentials server-only and validate model behavior against representative product cases.

## Stack and conventions

- **Package manager**: `pnpm` (use it for every install, never npm/yarn).
- **Tailwind**: 4.x via `@tailwindcss/postcss`. Keep `src/styles/tailwind.css` on Tailwind 4 syntax (`@theme`, `@utility`, and `@custom-variant`); do not introduce a Tailwind 3 config or directives.
- **State**: Zustand for client stores. TanStack Query is in the codebase but Devtools were removed — don't re-add the floating devtools.
- **Tests**: Vitest + Testing Library. Run the relevant tests for changed behavior. UI changes must also be hand-verified in a browser; the full gating signals are `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, then `pnpm build`.
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
- Tailwind CSS 4 — preserve the existing v4 PostCSS and CSS-first configuration.
- For backend infra / schema / debug tasks, use the **Supabase MCP** (available in this workspace). Apply migrations via `apply_migration`, run ad-hoc SQL via `execute_sql`, deploy edge functions via `deploy_edge_function`, and read logs via `get_logs`. Never edit Supabase data through screenshots / guessing — query the live DB through the MCP. The legacy InsForge MCP/CLI is **not** the active backend; ignore older docs that reference it.
- When feature entry points are incomplete, mock-backed, or not fully wired, mark them as `Pronto`/`Proximamente` instead of exposing unfinished flows in navigation.
