/** Shared by route validation and navigation so every enabled tab is reachable. */
export const CITY_EDITOR_TABS = [
  { id: 'directory', labelKey: 'tabDirectory' },
  { id: 'businesses', label: 'Negocios' },
  { id: 'services', label: 'Servicios profesionales' },
  { id: 'forum', label: 'Foro' },
  { id: 'chat', label: 'Chat público' },
  { id: 'events', label: 'Eventos' },
  { id: 'metadata', labelKey: 'tabMetadata' },
  { id: 'images', labelKey: 'tabImages' },
  { id: 'admins', labelKey: 'tabAdmins' },
  { id: 'features', labelKey: 'tabFeatures' },
  { id: 'places', labelKey: 'tabPlaces' },
  { id: 'media', labelKey: 'tabMedia' },
  { id: 'promotions', labelKey: 'tabPromotions' },
  { id: 'news', labelKey: 'tabNews' },
  { id: 'classifieds', labelKey: 'tabClassifieds' },
  { id: 'emprendimientos', labelKey: 'tabEmprendimientos' },
  { id: 'contact', labelKey: 'tabContact' },
  { id: 'complaints', labelKey: 'tabComplaints' },
] satisfies readonly { id: string; label?: string; labelKey?: string }[]

export type CityEditorTab = typeof CITY_EDITOR_TABS[number]['id']
export function parseCityEditorTab(value?: string): CityEditorTab {
  return CITY_EDITOR_TABS.find(tab => tab.id === value)?.id ?? 'metadata'
}
