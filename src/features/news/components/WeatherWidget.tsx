'use client'

import { useState } from 'react'
import { CloudSun, LoaderCircle, Search } from 'lucide-react'

type Weather = { city: string; country: string; current: { temperature_2m: number; wind_speed_10m: number; weather_code: number }; daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] } }

export function WeatherWidget() {
  const [city, setCity] = useState('Popayán')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function loadWeather(event?: React.FormEvent) {
    event?.preventDefault(); setLoading(true); setError(null)
    try { const response = await fetch(`/api/news/weather?city=${encodeURIComponent(city)}`); const data = await response.json(); if (!response.ok) throw new Error('No encontramos esa ciudad.'); setWeather(data) } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar el clima.') } finally { setLoading(false) }
  }
  return <section id="clima" className="scroll-mt-20 border-t border-neutral-200 pt-5 dark:border-neutral-800"><div className="flex items-center gap-2"><CloudSun className="size-5 text-secondary-600" aria-hidden="true" /><h2 className="font-bold">Clima</h2></div><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Consulta el pronóstico de cualquier ciudad.</p><form onSubmit={loadWeather} className="mt-3 flex gap-2"><label className="sr-only" htmlFor="weather-city">Ciudad</label><input id="weather-city" required maxLength={80} autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-neutral-700 dark:bg-neutral-950" /><button disabled={loading || !city.trim()} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white transition-colors hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-neutral-950" aria-label={loading ? 'Consultando el clima' : 'Consultar clima'}>{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}</button></form><div aria-live="polite">{error && <p className="mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}{weather && <div className="mt-4"><p className="text-3xl font-black tracking-[-0.03em] tabular-nums">{Math.round(weather.current.temperature_2m)}°C</p><p className="mt-1 text-sm leading-5 text-neutral-500 dark:text-neutral-400">{weather.city}, {weather.country}<br />Viento: {Math.round(weather.current.wind_speed_10m)} km/h</p><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">{weather.daily.time.map((day, index) => <div key={day} className="border-t border-neutral-200 pt-2 dark:border-neutral-700"><p className="capitalize text-neutral-500">{new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(new Date(`${day}T12:00:00`))}</p><p className="mt-1 font-semibold tabular-nums">{Math.round(weather.daily.temperature_2m_max[index])}° / {Math.round(weather.daily.temperature_2m_min[index])}°</p></div>)}</div></div>}</div></section>
}
