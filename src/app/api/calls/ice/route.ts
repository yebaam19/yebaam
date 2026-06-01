import { NextResponse } from 'next/server';
import { getServerAccessToken } from '@/utils/supabase/server';

/**
 * Mints short-lived ICE servers for WebRTC.
 *
 * Prefers Cloudflare Realtime TURN (managed TURN at the edge) when the env is
 * configured; otherwise degrades to public STUN only — calls still connect for
 * the majority of peers, and strict-NAT peers simply fail to connect rather
 * than the button being broken. Auth-gated so the TURN allocation can't be
 * minted anonymously. The proxy does NOT run on /api/**, so we 401 ourselves.
 *
 * Env (optional): CLOUDFLARE_REALTIME_TURN_KEY_ID, CLOUDFLARE_REALTIME_TURN_API_TOKEN
 * (create a TURN key in Cloudflare dashboard → Realtime → TURN).
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUN_ONLY: RTCIceServer[] = [
  { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] },
];

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keyId = process.env.CLOUDFLARE_REALTIME_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_REALTIME_TURN_API_TOKEN;

  if (!keyId || !apiToken) {
    console.warn(
      '[calls/ice] Cloudflare TURN env not set — returning STUN-only ICE servers. ' +
        'Peers behind strict/symmetric NAT may fail to connect. Set ' +
        'CLOUDFLARE_REALTIME_TURN_KEY_ID + CLOUDFLARE_REALTIME_TURN_API_TOKEN to enable TURN.',
    );
    return NextResponse.json({ iceServers: STUN_ONLY, turn: false });
  }

  try {
    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: 86400 }),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[calls/ice] Cloudflare TURN request failed', res.status, detail);
      return NextResponse.json({ iceServers: STUN_ONLY, turn: false });
    }

    const data = (await res.json().catch(() => ({}))) as { iceServers?: RTCIceServer[] };
    const iceServers =
      Array.isArray(data.iceServers) && data.iceServers.length > 0 ? data.iceServers : STUN_ONLY;
    return NextResponse.json({ iceServers, turn: iceServers !== STUN_ONLY });
  } catch (err) {
    console.error('[calls/ice] TURN fetch threw', err);
    return NextResponse.json({ iceServers: STUN_ONLY, turn: false });
  }
}
