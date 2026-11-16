import { defineConfig, mergeConfig } from 'vitest/config';
import audit from './vitest.audit.config';
export default mergeConfig(audit, defineConfig({ test: {
  environment: 'jsdom',
  include: ['src/features/auth/components/login-form.test.tsx'],
  setupFiles: ['./src/test/auth/audit-ui.setup.ts'],
} }));
