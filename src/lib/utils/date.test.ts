import { describe, expect, it } from 'vitest';
import { formatBirthDate, parseISODate } from './date';

describe('parseISODate', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const date = parseISODate('1990-05-15');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(1990);
    expect(date!.getMonth()).toBe(4);
    expect(date!.getDate()).toBe(15);
    expect(date!.getHours()).toBe(0);
    expect(date!.getMinutes()).toBe(0);
  });

  it('accepts longer ISO strings and uses only the date part', () => {
    const date = parseISODate('1990-05-15T12:34:56Z');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(1990);
    expect(date!.getMonth()).toBe(4);
    expect(date!.getDate()).toBe(15);
    expect(date!.getHours()).toBe(0);
  });

  it('returns null for falsy or malformed input', () => {
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate(undefined)).toBeNull();
    expect(parseISODate('')).toBeNull();
    expect(parseISODate('not-a-date')).toBeNull();
    expect(parseISODate('1990-13-40')).toBeNull();
  });
});

describe('formatBirthDate', () => {
  it('formats a YYYY-MM-DD string in Spanish long form', () => {
    expect(formatBirthDate('1990-05-15')).toBe('15 de mayo de 1990');
  });

  it('round-trips through parseISODate without timezone drift', () => {
    const parsed = parseISODate('1990-05-15');
    expect(formatBirthDate(parsed)).toBe('15 de mayo de 1990');
  });

  it('returns null for falsy or malformed input', () => {
    expect(formatBirthDate(null)).toBeNull();
    expect(formatBirthDate(undefined)).toBeNull();
    expect(formatBirthDate('')).toBeNull();
    expect(formatBirthDate('not-a-date')).toBeNull();
  });
});
