export function isRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REALTIME_ENABLED === 'true';
}
