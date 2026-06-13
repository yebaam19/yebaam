import 'server-only'

import { cache } from 'react'

import { listServices } from './services-list.server'
import type { ProfessionalServiceBasic } from '../interfaces/professional-service.interfaces'

/** Free-text service search. Thin wrapper over {@link listServices}'s `search`
 *  filter; ignores queries shorter than 2 chars. */
export const searchServices = cache(
  async (query: string, limit = 10): Promise<ProfessionalServiceBasic[]> => {
    if (!query || query.trim().length < 2) return []
    const { services } = await listServices({ search: query, limit })
    return services
  },
)
