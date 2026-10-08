/** All calendar/editor times use the app's Colombian scheduling zone, explicitly labeled in UI. */
export const EVENT_TIME_ZONE = 'America/Bogota';
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: EVENT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
export function eventDay(iso: string) { return dayFormatter.format(new Date(iso)); }
export function eventMonth(iso: string) { return eventDay(iso).slice(0, 7); }
export function monthBounds(month: string) {
  const [year, number] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, number, 1));
  return { from: `${month}-01T00:00:00-05:00`, until: `${next.toISOString().slice(0, 10)}T00:00:00-05:00` };
}
export function localEventTime(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: EVENT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  const get = (kind: string) => parts.find((part) => part.type === kind)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
export function toEventISO(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return '';
  const date = new Date(`${local}:00-05:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}
export function eventStatus(event: { is_cancelled: boolean; starts_at: string; ends_at: string }, now: string) {
  if (event.is_cancelled) return 'cancelled';
  if (Date.parse(now) >= Date.parse(event.ends_at)) return 'finished';
  return Date.parse(now) >= Date.parse(event.starts_at) ? 'ongoing' : 'upcoming';
}
export function formatEventDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { timeZone: EVENT_TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
export function eventOccursOn(event: { starts_at: string; ends_at: string }, day: string) {
  return eventDay(event.starts_at) <= day && eventDay(new Date(Date.parse(event.ends_at) - 1).toISOString()) >= day;
}
