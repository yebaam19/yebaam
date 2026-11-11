import { expect, it } from 'vitest'
import { CITY_PORTAL_SHORTCUTS } from '@/features/cities/data/portal-navigation'
import { resolveHref } from '@/features/cities/data/portal-sections'

it('keeps the city chat, forum, directory and places reachable alongside discovery categories', () => {
  const routes = Object.fromEntries(CITY_PORTAL_SHORTCUTS.map((section) => [section.id, resolveHref(section, 'san-antonio-texas')]))
  expect(routes.chats).toBe('/cities/san-antonio-texas/public-chat')
  expect(routes.forums).toBe('/cities/san-antonio-texas/forums')
  expect(routes.directories).toBe('/cities/san-antonio-texas/directory')
  expect(routes.places).toBe('/cities/san-antonio-texas/places')
  expect(routes.food).toBe('/cities/san-antonio-texas/directory/food')
})
