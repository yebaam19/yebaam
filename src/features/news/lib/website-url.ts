export type NewsWebsiteUrlResult = { ok: true; value: string | null } | { ok: false; error: string }

const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i

export function normalizeNewsWebsiteUrl(input?: string | null): NewsWebsiteUrlResult {
  const value = input?.trim() ?? ''
  if (!value) return { ok: true, value: null }

  if (value.length > 2048) {
    return { ok: false, error: 'La dirección del sitio web es demasiado larga.' }
  }

  const candidate = URL_SCHEME.test(value) ? value : value.startsWith('//') ? `https:${value}` : `https://${value}`

  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      return { ok: false, error: 'Escribe una dirección web válida, por ejemplo: yebaam.com.' }
    }

    if (url.username || url.password) {
      return { ok: false, error: 'La dirección web no debe incluir usuario ni contraseña.' }
    }

    return { ok: true, value: url.toString() }
  } catch {
    return { ok: false, error: 'Escribe una dirección web válida, por ejemplo: yebaam.com.' }
  }
}
