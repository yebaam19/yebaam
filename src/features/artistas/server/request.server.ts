import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { ContactRequest, BookingRequest, CollaborationRequest } from '../types'

type IncomingRequests = {
  contact: ContactRequest[]
  booking: BookingRequest[]
  collaboration: CollaborationRequest[]
}

export const getIncomingRequests = cache(async (artistProfileId: string): Promise<IncomingRequests> => {
  const client = await getServerClient()
  const [{ data: contact }, { data: booking }, { data: collaboration }] = await Promise.all([
    client.rpc('get_contact_requests',       { p_artist_profile_id: artistProfileId }),
    client.rpc('get_booking_requests',       { p_artist_profile_id: artistProfileId }),
    client.rpc('get_collaboration_requests', { p_artist_profile_id: artistProfileId }),
  ])
  return {
    contact:       (contact       ?? []) as ContactRequest[],
    booking:       (booking       ?? []) as BookingRequest[],
    collaboration: (collaboration ?? []) as CollaborationRequest[],
  }
})
