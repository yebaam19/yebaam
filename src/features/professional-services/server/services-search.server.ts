import 'server-only'

import { cache } from 'react'

import { listServices } from './services-list.server'
import type { ProfessionalServiceBasic } from '../interfaces/professional-service.interfaces'

/** Anti-scraping: max results a search caller can request. */
const MAX_SEARCH_LIMIT = 48
/** Anti-scraping: longer strings are not human search terms. */
const MAX_QUERY_LENGTH = 120

/** Free-text service search. Thin wrapper over {@link listServices}'s `search`
 *  filter; ignores queries shorter than 2 chars. Clamps the caller-supplied
 *  limit and query length here too (listServices re-validates, but this module
 *  must not depend on it). */
export const searchServices = cache(
  async (query: string, limit = 10): Promise<ProfessionalServiceBasic[]> => {
    const term = (query ?? '').trim().slice(0, MAX_QUERY_LENGTH)
    if (term.length < 2) return []
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), MAX_SEARCH_LIMIT)
    const { services } = await listServices({ search: term, limit: safeLimit })
    return services
  },
)
