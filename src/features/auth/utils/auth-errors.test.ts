import { describe, expect, it } from 'vitest';
import { isEmailNotConfirmedError } from './auth-errors';

describe('isEmailNotConfirmedError', () => {
  it('matches a Supabase error whose message is "Email not confirmed"', () => {
    expect(isEmailNotConfirmedError({ message: 'Email not confirmed' })).toBe(true);
  });

  it('matches by code when no message is present', () => {
    expect(isEmailNotConfirmedError({ code: 'email_not_confirmed' })).toBe(true);
  });

  it('matches the message case-insensitively', () => {
    expect(isEmailNotConfirmedError({ message: 'email not confirmed' })).toBe(true);
  });

  it('matches a real Error instance', () => {
    expect(isEmailNotConfirmedError(new Error('Email not confirmed'))).toBe(true);
  });

  it('does NOT match an invalid-credentials error', () => {
    expect(
      isEmailNotConfirmedError({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
    ).toBe(false);
  });

  it('does NOT match non-error junk', () => {
    expect(isEmailNotConfirmedError(null)).toBe(false);
    expect(isEmailNotConfirmedError(undefined)).toBe(false);
    expect(isEmailNotConfirmedError('Email not confirmed')).toBe(false);
    expect(isEmailNotConfirmedError({})).toBe(false);
    expect(isEmailNotConfirmedError(42)).toBe(false);
  });
});
