import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'insforge_access_token'
const MAX_AGE = 60 * 60 * 24 * 7

export async function POST(request: NextRequest) {
  const { accessToken } = (await request.json().catch(() => ({}))) as {
    accessToken?: string
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
