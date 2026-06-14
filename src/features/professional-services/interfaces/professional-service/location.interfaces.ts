// ============================================================================
// UBICACIÓN (Para filtros)
// ============================================================================

export interface State {
  id: string
  name: string
  slug: string
  country: {
    id: string
    name: string
  }
}

export interface City {
  id: string
  name: string
  slug: string
  stateId: string
  state?: State
}

export interface LocationFiltersData {
  states: State[]
  cities: City[]
}
