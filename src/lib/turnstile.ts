import 'server-only'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface SiteverifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

export interface VerifyTurnstileOptions {
  remoteIp?: string | null
  expectedAction?: string
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  options: VerifyTurnstileOptions = {},
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'TURNSTILE_SECRET_KEY missing on server' }
    }
    return { ok: true }
  }

  if (!token) {
    return { ok: false, reason: 'Falta el token CAPTCHA' }
  }

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token)
  if (options.remoteIp) body.set('remoteip', options.remoteIp)

  let res: Response
  try {
    res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Error de red al verificar CAPTCHA',
    }
  }

  if (!res.ok) {
    return { ok: false, reason: `Turnstile siteverify HTTP ${res.status}` }
  }

  const json = (await res.json().catch(() => null)) as SiteverifyResponse | null
  if (!json) {
    return { ok: false, reason: 'Respuesta inválida de Turnstile' }
  }

  if (!json.success) {
    const codes = json['error-codes']?.join(', ') ?? 'unknown'
    return { ok: false, reason: `Verificación CAPTCHA fallida (${codes})` }
  }

  if (options.expectedAction && json.action && json.action !== options.expectedAction) {
    return { ok: false, reason: 'Acción CAPTCHA no coincide' }
  }

  return { ok: true }
}
