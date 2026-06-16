'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { ContactRequest, BookingRequest, CollaborationRequest, RequestStatus } from '../types'

async function getOptionalSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  return { userId: data.user?.id ?? null, client }
}

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

const ContactRequestSchema = z.object({
  artist_profile_id: z.string().min(1),
  name:              z.string().min(2).max(120),
  email:             z.string().min(1),
  phone:             z.string().max(30).optional(),
  subject:           z.string().max(200).optional(),
  message:           z.string().min(10).max(3000),
})

const BookingRequestSchema = z.object({
  artist_profile_id: z.string().min(1),
  name:              z.string().min(2).max(120),
  email:             z.string().min(1),
  phone:             z.string().max(30).optional(),
  event_type:        z.string().max(100).optional(),
  event_date:        z.string().optional(),
  location:          z.string().max(200).optional(),
  budget:            z.coerce.number().nonnegative().optional(),
  currency:          z.string().max(3).optional(),
  message:           z.string().min(10).max(3000),
})

const CollaborationRequestSchema = z.object({
  artist_profile_id:  z.string().min(1),
  name:               z.string().min(2).max(120),
  email:              z.string().min(1),
  phone:              z.string().max(30).optional(),
  collaboration_type: z.string().max(100).optional(),
  proposal:           z.string().min(10).max(3000),
  message:            z.string().max(3000).optional(),
})

export async function sendContactRequest(formData: FormData) {
  const { userId, client } = await getOptionalSession()
  const parsed = ContactRequestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('artistas_send_contact_request', {
    p_requester_id: userId,
    p_data:         parsed.data,
  })
  if (error) throw new Error(error.message)
  return data as ContactRequest
}

export async function sendBookingRequest(formData: FormData) {
  const { userId, client } = await getOptionalSession()
  const parsed = BookingRequestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('artistas_send_booking_request', {
    p_requester_id: userId,
    p_data:         parsed.data,
  })
  if (error) throw new Error(error.message)
  return data as BookingRequest
}

export async function sendCollaborationRequest(formData: FormData) {
  const { userId, client } = await getOptionalSession()
  const parsed = CollaborationRequestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('artistas_send_collaboration_request', {
    p_requester_id: userId,
    p_data:         parsed.data,
  })
  if (error) throw new Error(error.message)
  return data as CollaborationRequest
}

export async function updateContactRequestStatus(requestId: string, status: RequestStatus) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_update_contact_request_status', {
    p_id:     requestId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]/solicitudes', 'page')
}

export async function updateBookingRequestStatus(requestId: string, status: RequestStatus) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_update_booking_request_status', {
    p_id:     requestId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]/solicitudes', 'page')
}
