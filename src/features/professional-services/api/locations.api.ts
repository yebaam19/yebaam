/**
 * Locations API Client — thin facade over the Server Actions. Real states /
 * cities come from the city-portal schema (public.states / public.cities).
 */

import type { State, City, LocationFiltersData } from '../interfaces/professional-service.interfaces'
import {
  allCitiesAction,
  citiesByStateAction,
  locationFiltersAction,
  statesAction,
} from '../actions/services.actions'

class LocationsApiClient {
  getStates(): Promise<State[]> {
    return statesAction()
  }

  getCitiesByState(stateId: string): Promise<City[]> {
    return citiesByStateAction(stateId)
  }

  getAllCities(): Promise<City[]> {
    return allCitiesAction()
  }

  getLocationFiltersData(): Promise<LocationFiltersData> {
    return locationFiltersAction()
  }
}

export const locationsApiClient = new LocationsApiClient()
