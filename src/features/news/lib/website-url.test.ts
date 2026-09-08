import { describe, expect, it } from 'vitest'
import { normalizeNewsWebsiteUrl } from './website-url'

describe('normalizeNewsWebsiteUrl', () => {
  it('accepts an omitted optional website', () => {
    expect(normalizeNewsWebsiteUrl('  ')).toEqual({ ok: true, value: null })
  })

  it('adds HTTPS when the user enters only the domain', () => {
    expect(normalizeNewsWebsiteUrl('www.yebaam.com')).toEqual({
      ok: true,
      value: 'https://www.yebaam.com/',
    })
  })

  it('preserves a complete HTTP or HTTPS URL', () => {
    expect(normalizeNewsWebsiteUrl('https://yebaam.com/noticias')).toEqual({
      ok: true,
      value: 'https://yebaam.com/noticias',
    })
    expect(normalizeNewsWebsiteUrl('http://example.com')).toEqual({
      ok: true,
      value: 'http://example.com/',
    })
  })

  it('rejects non-web protocols and credentials', () => {
    expect(normalizeNewsWebsiteUrl('javascript:alert(1)').ok).toBe(false)
    expect(normalizeNewsWebsiteUrl('https://user:secret@example.com').ok).toBe(false)
  })
})
