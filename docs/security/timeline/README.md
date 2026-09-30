# Timeline security repair: SQL deployed, application prepared locally

Original package prepared 2026-09-30 UTC against repository revision
`101b691bf10a069cddd258c79e1dcc68aec65a2b` and read-only Supabase catalogs for
project `hwppwxavvamnljfcanje`. The original package was a read-only review;
the subsequent authorized Supabase rollout is recorded below.

## Supabase rollout — 2026-09-30 UTC

After the user instructed us to continue with the MCPs, Supabase MCP
`apply_migration` applied `harden_timeline_posts_identity_visibility`, version
`20260930041641`, to project `hwppwxavvamnljfcanje`.
The checked-in [migration](../../../supabase/migrations/20260930041641_harden_timeline_posts_identity_visibility.sql)
contains the exact reviewed function body. Its guard accepts only the original
fingerprint or the exact hardened fingerprint, so reapplication is idempotent
without permitting arbitrary SQL drift.

- Original fingerprint: `88de1ed97716eeaef69c1f99c87720ec`.
- Deployed fingerprint: `577ddc12bc94c39841ffab30ac0e2871`.
- Function OID, owner, ACL, all 17 return columns, stability and search path
  remain unchanged.
- All 46 SQL checks pass: the original 20 plus three migration checks on each
  PostgreSQL runtime. Added checks cover the exact reviewed body, idempotence,
  contract preservation and rejection of unreviewed SQL drift.
- The proposed query passed `EXPLAIN` against the real schema before replacement.
- [Read-only live checks](verify-live.sql) pass for three existing authors:
  anonymous, other-user, null-ID and missing-subject requests return no rows;
  owner timelines contain posts; results respect caller-visible RLS and exclude
  page/blog walls; consecutive pages match the equivalent combined page.
- Security advisors introduce no new findings. Existing generic warnings about
  this intentionally retained `SECURITY DEFINER`/EXECUTE contract remain.
- The locally built application renders the authenticated feed against the
  deployed function after loading completes.

No staging project was connected, so the staging step was not completed.
Sign-out/expired-session transitions, real friendship revocation and a full
PostgREST A/B token matrix remain unverified. No publication, friendship or
membership rows were changed by live verification. The frontend has not been
published, and no commits or pushes were made.

## Local integration verification — 2026-09-30 UTC

The supplied ZIP patch was applied without conflicts to the existing `main`
working tree. During that initial local integration, no commits, pushes,
application deployments or database writes were performed. The media loader now derives its client type from the repository
Supabase wrapper instead of importing the SDK outside `src/utils/supabase/`.

- All 47 added application tests pass; all 40 isolated SQL checks pass.
- `next typegen`, `tsc --noEmit`, changed-file ESLint and the complete `pnpm build`
  pass, including generation of all 139 static pages.
- With Supabase test credentials disabled, the full suite has the same 26
  failure entries as an isolated copy of `HEAD`: 17 failing files and 6 failing
  tests. Passing tests increased from 64 to 111; 73 remain skipped. Integration
  tests were not given production credentials because some write/delete rows.
- Global lint reports 264 errors and 342 warnings, including local skill files;
  the changed application and test files pass lint.
- Browser smoke checks on the built app confirm feed rendering, public genre
  display, club counts, role/membership and gallery rendering. An anonymous HTTP
  timeline request returns the existing empty-result contract.
- Read-only Supabase MCP queries confirm the original function fingerprint,
  17-column contract, owner/ACL, visibility policy and music join relationships.

These initial local checks preceded the Supabase rollout recorded above.
No staging project was available; the remaining verification gaps are stated
explicitly in the rollout record.

## The problem and narrow repair

The original `public.get_timeline_posts(uuid, integer, integer)` ran as its owner
(`postgres`) with `SECURITY DEFINER`. It is callable by anonymous and authenticated
roles and trusted the supplied user ID. It could therefore return another
person's private timeline. Its business branch also chose posts without checking
the caller's row visibility. Application filtering alone cannot protect the
directly callable RPC.

`hardening.proposed.sql` preserves the original reviewed **proposal**, outside
the automatic migrations directory. The deployed migration above uses the same
function body with a guard that also permits its exact hardened definition. Its transaction checks the reviewed original
function definition's MD5 before replacing only that function. The original was
rechecked read-only immediately before rollout on 2026-09-30 and was
`88de1ed97716eeaef69c1f99c87720ec`. `original.catalog.txt` is the exact catalog
snapshot for review/testing, not a recommended rollback.

The proposal:

- Requires a non-null `auth.uid()` matching `p_user_id` for a normal session
- Returns zero rows for anonymous, missing-subject, null-ID or other-user requests
- Retains own posts of all privacy levels and public/friends posts from accepted
  friends in either relationship direction
- Applies the current `posts_select_visible` rule to business posts **before**
  choosing the latest three visible posts per followed active, nondeleted business
- Excludes blog and page walls before ranking and pagination, including malformed
  rows tagged as both a business and a page/blog
- Preserves business name, slug and image metadata
- Keeps the trusted service-role JWT exception for server compatibility; this
  exception must never be exposed through a user-controlled service-role proxy
- Caps the limit at 100; null uses 20, zero/negative uses zero; negative/null offset
  uses zero. Large offsets remain supported but can still be expensive
- Adds the post ID as a deterministic tie-breaker for equal timestamps

## API and database compatibility

The 3 argument names, types and defaults, all **17** return columns/types, function
OID, language, stability, `SECURITY DEFINER`, search path, owner and ACL remain
unchanged. In particular, `page_id` is **not** added to the return contract. No
function is dropped, no grant revoked, and no other table/policy/function altered.

The existing authenticated API and first-paint calls pass the verified user's ID:

- `src/app/api/posts/route.ts`
- `src/app/(app)/feed/post/server/posts.server.ts`

Public blog/business/page walls use separate queries. Excluding page posts in SQL
agrees with the current API's page-wall exclusion and avoids consuming feed slots.
The initial server-rendered feed previously lacked that exclusion. The coordinated
TypeScript hardening checks returned IDs through the caller-bound client and fails
closed on verification errors; it can coexist with the repaired RPC.

**SQL-first rollout is required.** Deploy and verify the repaired RPC before the
coordinated application patch, first in staging and then, after explicit approval,
in production. On the legacy RPC, caller-side filtering happens after `LIMIT` and
`OFFSET`; hidden/page-wall rows can therefore produce a short or empty page, and
the client may stop loading before later visible posts. The SQL repair applies
visibility and wall exclusions before ranking/pagination. Do not present the
application patch alone as a complete or pagination-compatible production fix.

Existing `SECURITY DEFINER` is retained because callers lack direct `comidas` schema
access. A blind switch to invoker or a schema-wide grant would break or expand
access. The existing `auth.role()` helper is used only to preserve the trusted
service-role compatibility exception. It reads signed request-role claims, not
user-editable metadata. This patch is not a new RLS policy using deprecated
role-based ownership checks. An invoker redesign is a separate, reviewed change.

## Local verification results

The isolated package at `supabase/tests/timeline` executes real PostgreSQL via
PGlite against synthetic data. It runs **20 tests on PostgreSQL 17.5** and the
same **20 tests on PostgreSQL 18.3**. The production catalog reports PostgreSQL
17.6; these are useful local SQL/runtime checks, not an exact production replica.

Covered behavior:

- The original's identity, private-business and page-wall flaws reproduce on
  synthetic records; applying the proposal removes those leaks
- Anonymous, unrelated authenticated, null-ID, missing-subject and user-metadata
  role-spoof requests fail closed
- Own posts, accepted friends in both directions, current friendship revocation,
  public business content and business metadata work
- Hidden business posts do not displace the three visible slots
- Blog/page, inactive/deleted/unfollowed-business exclusions happen correctly
- Authenticated output is a subset of caller-visible rows under the observed RLS
- Business joins work while direct `comidas` schema usage remains unavailable
- Trusted service behavior, default/null/capped limits, zero/negative values,
  offsets and equal-timestamp ordering behave as documented
- Function identity, owner, ACL, argument/return contract remain unchanged
- Catalog drift and accidental second application abort before overwriting SQL

Run instructions and dependency isolation are in
[`supabase/tests/timeline/README.md`](../../../supabase/tests/timeline/README.md).
The runner prints the PostgreSQL version and individual test results.

These tests do not validate JWT signatures, Supabase Auth, PostgREST, HTTP errors,
the full production schema/triggers/policies, concurrent database sessions,
production performance, or browser/session-refresh behavior. No production-scale
latency claim follows from a tiny synthetic fixture. Application checks are
reported separately.

## Rollout procedure for additional environments

1. Review this exact diff and any service-role consumers outside the checked-out
   repository. Direct administrator SQL with no JWT returns no rows; new server
   consumers must bind a legitimate request context
2. Prepare an authorized isolated Supabase staging environment with the matching
   complete schema and only synthetic data. Validate the RPC through PostgREST
   with real anonymous and authenticated tokens, plus the required service flow
3. Run application tests/type-check/lint/build. In a browser, verify first paint,
   load-more, empty feeds, page/business/blog walls, stale sessions, sign-in/out,
   and token refresh. Inspect meaningful query plans on representative data
4. Recheck current function definition, owner/ACL, relevant column types,
   `posts_select_visible`, and `are_friends` before deployment. The MD5 guard checks
   only the timeline definition, so dependency drift requires explicit review
5. Generate a real migration using the installed Supabase CLI's documented
   migration workflow after staging verification. This checkout has no configured
   local Supabase stack/CLI, so no migration timestamp was invented. The proposal
   intentionally fails if reapplied; do not remove its guard to force a deployment
6. Obtain approval for replacing this exact production function. A general security
   request does not approve production SQL writes or permission changes
7. After approval, deploy and verify the SQL first, then the application patch.
   Verify the contract and approved smoke tests at each step. If behavior
   regresses, prefer a forward repair. Restoring the original reopens the known
   flaw and requires a separate explicit security decision

## Boundaries and references

This does not repair friendship self-acceptance, membership/invitation escalation,
messaging authorization, media cleanup ownership, or broader RLS issues. The
timeline still trusts accepted relationships as the current RLS does; those
independent findings remain open. The existing public-business visibility rule
does not implement a platform-wide blocklist; that is also outside this patch.

The repair enforces the existing privacy rule and is consistent with the repo's
Manual de Convivencia articles 3, 5 and 6 and Macro Reglamento article 2. It does
not claim complete enforcement of all governance requirements.

- [PostgreSQL CREATE FUNCTION and replacement compatibility](https://www.postgresql.org/docs/17/sql-createfunction.html)
- [Supabase database function security](https://supabase.com/docs/guides/database/functions)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PGlite official in-memory runtime documentation](https://pglite.dev/docs/)
- [Supabase changelog reviewed for relevant breaking changes](https://supabase.com/changelog)
