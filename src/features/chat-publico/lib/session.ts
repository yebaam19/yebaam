import 'server-only'

import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'node:crypto'

const COOKIE_NAME = 'yb_chat_token'
const NICK_COOKIE = 'yb_chat_nick'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

function generateToken() {
  return randomBytes(24).toString('base64url')
}

/**
 * Returns the caller's opaque chat session token, creating & persisting one if
 * the cookie is missing. Used to bind guest/nickname identities and presence
 * rows to a browser session without hitting auth.
 */
export async function getOrCreateSessionToken(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(COOKIE_NAME)?.value
  if (existing && existing.length >= 20) return existing
  const token = generateToken()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
  return token
}

/** Read the token without creating one. Useful from RSC that must stay read-only. */
export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE_NAME)?.value ?? null
}

export async function readPreferredNickname(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(NICK_COOKIE)?.value ?? null
}

/**
 * Non-reversible hash of the session token used as the DB binding key so the
 * raw token never leaves the server. Safe to store in rows that realtime
 * broadcasts to other subscribers.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function writePreferredNickname(nickname: string): Promise<void> {
  const jar = await cookies()
  jar.set(NICK_COOKIE, nickname, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}
