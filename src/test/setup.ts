import '@testing-library/jest-dom/vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { afterEach } from 'vitest';

// jsdom-only cleanup. The node project does not have a DOM and will never
// hit this branch — but importing `cleanup` is a no-op in the node env so
// we can register it unconditionally and let React Testing Library decide.
if (typeof window !== 'undefined') {
  // Inline dynamic require so the node project (no React DOM) does not
  // try to resolve the testing-library entry.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cleanup } = require('@testing-library/react');
  afterEach(() => cleanup());
}

// Minimal `.env*` loader for tests (avoids pulling in the `dotenv` dep).
// Vitest/Vite by default only exposes VITE_-prefixed vars to `process.env`;
// server-function tests need NEXT_PUBLIC_SUPABASE_* keys to hit the seeded
// dev project as anon, so we hydrate them manually here.
function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

