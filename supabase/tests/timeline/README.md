# Isolated timeline SQL regression tests

From the repository root:

```sh
pnpm --dir supabase/tests/timeline install --ignore-workspace --ignore-scripts --frozen-lockfile
pnpm --dir supabase/tests/timeline test
```

`--ignore-workspace` matters: the repository root has a `pnpm-workspace.yaml`.
Without the flag, installation can target the application instead of this
independent test package. The test runner itself does not install software.
The Node test files use `*.checks.mjs` names so the application's root Vitest
discovery does not try to run this separate SQL suite.

This package pins official `@electric-sql/pglite` releases and their registry
integrities in its own lockfile. The alias `pglite-pg17` is the same official
package at version 0.4.6, providing PostgreSQL 17.5. Version 0.5.8 provides
PostgreSQL 18.3. Neither is an application dependency.

The runner executes the original 20 tests plus three deployable-migration tests
once per runtime (46 checks total). Every database is an
ephemeral in-memory PGlite instance. There are no credentials, connection URLs,
production data, network database connections, Supabase project modifications,
or persistent database files. Never apply `schema.sql` to an existing database.

The fixture recreates only the column types and authorization dependencies used
by the timeline. It includes the catalog-observed `auth.uid()` / `auth.role()`
claim semantics, `are_friends` and `posts_select_visible` behavior. Test requests
use actual PostgreSQL roles and transaction-local synthetic JWT claims. PGlite
executes the reviewed SQL itself, not a JavaScript authorization approximation.

The original SQL must retain its exact bytes for the MD5 guard test. It is
intentionally vulnerable and is installed only in the disposable fixture before
the proposed function replacement. The baseline test demonstrates its leaks on
synthetic data so that the suite cannot accidentally pass against the old SQL.

See [the review and rollout checklist](../../../docs/security/timeline/README.md)
for scope, caveats, deployment status and remaining validation gaps.
