# CLAUDE.md

See [AGENTS.md](AGENTS.md) for all project conventions (package manager, stack, layout, Next.js 16 features, code style).

This file exists so Claude Code picks up the same rules as other AI tools. All guidance lives in `AGENTS.md` — keep them in sync by editing `AGENTS.md` only.

## Backend
The backend is **InsForge** — accessed via `@insforge/sdk` through `@/lib/insforge/client`. There is no custom backend / Express / NestJS layer. All data access (auth, database, storage) goes through the InsForge SDK. Use `.maybeSingle()` (not `.single()`) when a row may legitimately be missing — `.single()` returns HTTP 406 for zero rows.
