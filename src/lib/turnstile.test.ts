import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { verifyTurnstileToken } from './turnstile'

describe('verifyTurnstileToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('refuses verification when the server secret is missing in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await verifyTurnstileToken('test-token')).toEqual({
      ok: false,
      reason: 'TURNSTILE_SECRET_KEY missing on server',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires a token before contacting Siteverify', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await verifyTurnstileToken(null)).toEqual({
      ok: false,
      reason: 'Falta el token CAPTCHA',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a successful challenge without the expected action', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    }))

    expect(await verifyTurnstileToken('test-token', { expectedAction: 'signup' })).toEqual({
      ok: false,
      reason: 'Acción CAPTCHA no coincide',
    })
  })
})
