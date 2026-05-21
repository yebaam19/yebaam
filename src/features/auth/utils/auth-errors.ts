/**
 * Classifies a Supabase auth error as the "email not confirmed" case.
 *
 * `signInWithPassword` on an account created with `email_confirm: false`
 * rejects with an AuthApiError (`code: 'email_not_confirmed'`,
 * `message: 'Email not confirmed'`). By the time the error reaches the login
 * form it has been rethrown as a plain `Error`, so only `message` survives —
 * hence we match on message (case-insensitive) and also on `code` when present.
 */
export function isEmailNotConfirmedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && code === 'email_not_confirmed') return true;

  const message = (error as { message?: unknown }).message;
  if (typeof message === 'string' && /email not confirmed/i.test(message)) return true;

  return false;
}
