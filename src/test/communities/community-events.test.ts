import { describe, expect, it } from 'vitest';
import { eventDay, eventMonth, eventOccursOn, eventStatus, localEventTime, monthBounds, toEventISO } from '@/features/communities/lib/event-dates';
import { eventSchema, eventQuerySchema, eventMutationSchema } from '@/features/communities/schemas/communityEvent.schema';
const id = '11111111-1111-4111-8111-111111111111';
const input = { id, communityId: id, expectedVersion: 0, title: ' Encuentro ', organizer: 'Comunidad', location: 'Salón', startsAt: '2026-10-31T23:00:00-05:00', endsAt: '2026-11-01T00:00:00-05:00' };
describe('Community event contracts', () => {
  it('defaults new events to unpublished with attendance disabled', () => {
    expect(eventSchema.parse(input)).toMatchObject({ title: 'Encuentro', isPublished: false, rsvpEnabled: false, coverAssetId: null });
  });
  it('requires a place, valid range and safe optional URLs', () => {
    for (const patch of [{ location: '' }, { endsAt: input.startsAt }, { virtualUrl: 'javascript:alert(1)' }, { registrationUrl: 'not-a-url' }, { title: ' ' }]) {
      expect(eventSchema.safeParse({ ...input, ...patch }).success).toBe(false);
    }
    expect(eventSchema.safeParse({ ...input, location: '', virtualUrl: 'https://example.test/meeting' }).success).toBe(true);
  });
  it('validates cursors and requires explicit destructive confirmation', () => {
    expect(eventQuerySchema.safeParse({ communityId: id, month: '2026-13' }).success).toBe(false);
    expect(eventQuerySchema.safeParse({ communityId: id, month: '2026-10', cursor: { id, startsAt: 'anything),id.gt.bad' } }).success).toBe(false);
    expect(eventMutationSchema.safeParse({ communityId: id, id, expectedVersion: 1, operation: 'archive' }).success).toBe(false);
  });
  it('roundtrips Bogotá time without browser or server timezone dependence', () => {
    expect(eventDay('2026-11-01T04:00:00Z')).toBe('2026-10-31');
    expect(eventMonth('2026-11-01T04:00:00Z')).toBe('2026-10');
    expect(localEventTime('2026-11-01T04:00:00Z')).toBe('2026-10-31T23:00');
    expect(toEventISO('2026-10-31T23:00')).toBe('2026-11-01T04:00:00.000Z');
    expect(toEventISO('')).toBe('');
    expect(monthBounds('2026-12')).toEqual({ from: '2026-12-01T00:00:00-05:00', until: '2027-01-01T00:00:00-05:00' });
  });
  it('treats end as exclusive and cancellation takes priority over clock status', () => {
    const event = { starts_at: input.startsAt, ends_at: input.endsAt, is_cancelled: false };
    expect(eventOccursOn(event, '2026-10-31')).toBe(true);
    expect(eventOccursOn(event, '2026-11-01')).toBe(false);
    expect(eventStatus(event, '2026-10-31T20:00:00Z')).toBe('upcoming');
    expect(eventStatus(event, '2026-11-01T04:00:00Z')).toBe('ongoing');
    expect(eventStatus(event, '2026-11-01T05:00:00Z')).toBe('finished');
    expect(eventStatus({ ...event, is_cancelled: true }, input.endsAt)).toBe('cancelled');
  });
});
