import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Deliberately does not load the normal test setup (.env.local + live DB tests).
export default defineConfig({
  resolve: { alias: {
    '@': path.resolve(__dirname, 'src'),
    'server-only': path.resolve(__dirname, 'src/test/server-only-shim.ts'),
  } },
  test: {
    environment: 'node',
    setupFiles: ['./src/test/auth/audit-offline.setup.ts'],
    include: [
      'src/test/auth/login-security.test.ts',
      'src/test/auth/resend-security.test.ts',
      'src/test/auth/recovery-security.test.ts',
      'src/test/auth/attachment-security.test.ts',
      'src/lib/auth/safe-redirect.test.ts',
      'src/test/auth/claims-security.test.ts',
      'src/test/auth/otp-counter-security.test.ts',
      'src/test/auth/turnstile-security.test.ts',
    ],
  },
});
