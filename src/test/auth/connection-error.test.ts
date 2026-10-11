import { expect, it } from 'vitest';
import { isAuthConnectionError } from '@/lib/auth/connection-error';

it.each([
  new Error('fetch failed'),
  new TypeError('Failed to fetch'),
  new TypeError('Load failed'),
  new Error('Network request failed'),
  { code: 'ECONNREFUSED' },
  { name: 'AuthRetryableFetchError', status: 503, message: 'Service unavailable' },
])('recognizes a transient session lookup failure: %s', (error) => {
  expect(isAuthConnectionError(error)).toBe(true);
});

it.each([
  null, undefined, 'Network error', 42, {}, { message: 42 },
  new Error('Invalid credentials'),
  { name: 'AuthSessionMissingError', status: 400, message: 'Auth session missing!' },
  { name: 'AuthApiError', status: 401, message: 'Invalid JWT' },
])('does not classify other unknown values as transport failures: %s', (error) => {
  expect(isAuthConnectionError(error)).toBe(false);
});
