import { NextResponse, type NextRequest } from 'next/server'
import { getServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const city = request.nextUrl.searchParams.get('city')?.trim()
  if (!city || city.length > 80) return NextResponse.json({ error: 'city_required' }, { status: 400 })
  const geocode = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`, { next: { revalidate: 3600 } })
  if (!geocode.ok) return NextResponse.json({ error: 'weather_unavailable' }, { status: 502 })
  const location = (await geocode.json()) as { results?: Array<{ latitude: number; longitude: number; name: string; country?: string }> }
  const match = location.results?.[0]
  if (!match) return NextResponse.json({ error: 'city_not_found' }, { status: 404 })
  const forecast = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`, { next: { revalidate: 900 } })
  if (!forecast.ok) return NextResponse.json({ error: 'weather_unavailable' }, { status: 502 })
  const data = await forecast.json()
  return NextResponse.json({ city: match.name, country: match.country ?? '', current: data.current, daily: data.daily })
}
