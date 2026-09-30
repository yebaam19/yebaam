import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const major of ['17', '18']) {
  console.log(`\nRunning synthetic timeline SQL tests on PostgreSQL ${major}`);
  const result = spawnSync(process.execPath,
    ['--test', 'authorization.checks.mjs', 'contract.checks.mjs', 'migration.checks.mjs'], {
      cwd: fileURLToPath(new URL('.', import.meta.url)),
      env: { ...process.env, TIMELINE_TEST_PG: major },
      stdio: 'inherit',
    });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
