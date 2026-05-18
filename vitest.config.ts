import path from 'node:path';
import { defineConfig } from 'vitest/config';

// `server-only` is a runtime marker in Next.js (no real export); vitest can't
// resolve it from node_modules so we alias it to a no-op shim for tests.
const alias = {
  '@': path.resolve(__dirname, 'src'),
  'server-only': path.resolve(__dirname, 'src/test/server-only-shim.ts'),
};

/**
 * Vitest 4 dropped `environmentMatchGlobs` in favor of `projects`.
 * We run a `node` project for `*.ts` tests (server functions, pure logic)
 * and a `jsdom` project for `*.tsx` tests (React components) so component
 * tests have a working DOM + Testing Library setup.
 */
export default defineConfig({
  resolve: { alias },
  test: {
    setupFiles: ['./src/test/setup.ts'],
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
});
