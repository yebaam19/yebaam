'use server'

import { type ActionResult, setCityRowStatus, deleteCityRow } from './_shared'

/** Admin-only moderation actions for user-submitted city content: complaints,
 *  news, classifieds, and contact messages. Each is a thin wrapper over the
 *  generic status / delete mutators in [`_shared.ts`](./_shared.ts). */

const COMPLAINT_STATUSES = new Set(['new', 'seen', 'resolved', 'rejected'])
const NEWS_STATUSES = new Set(['pending', 'approved', 'rejected'])
const CLASSIFIED_STATUSES = new Set(['open', 'sold', 'closed'])
const CONTACT_STATUSES = new Set(['new', 'read', 'resolved'])

export async function setCityComplaintStatus(input: {
  complaintId: string
  status: 'new' | 'seen' | 'resolved' | 'rejected'
}): Promise<ActionResult<{ id: string; status: string }>> {
  return setCityRowStatus({
    table: 'city_complaints',
    id: input.complaintId,
    status: input.status,
    valid: COMPLAINT_STATUSES,
    section: 'complaints',
  })
}

export async function deleteCityComplaint(input: {
  complaintId: string
}): Promise<ActionResult<{ id: string }>> {
  return deleteCityRow({
    table: 'city_complaints',
    id: input.complaintId,
    section: 'complaints',
  })
}

export async function setCityNewsStatus(input: {
  newsId: string
  status: 'pending' | 'approved' | 'rejected'
}): Promise<ActionResult<{ id: string; status: string }>> {
  return setCityRowStatus({
    table: 'city_news',
    id: input.newsId,
    status: input.status,
    valid: NEWS_STATUSES,
    section: 'news',
    touchUpdatedAt: true,
  })
}

export async function setCityClassifiedStatus(input: {
  classifiedId: string
  status: 'open' | 'sold' | 'closed'
}): Promise<ActionResult<{ id: string; status: string }>> {
  return setCityRowStatus({
    table: 'city_classifieds',
    id: input.classifiedId,
    status: input.status,
    valid: CLASSIFIED_STATUSES,
    section: 'classifieds',
    touchUpdatedAt: true,
  })
}

export async function setCityContactMessageStatus(input: {
  messageId: string
  status: 'new' | 'read' | 'resolved'
}): Promise<ActionResult<{ id: string; status: string }>> {
  return setCityRowStatus({
    table: 'city_contact_messages',
    id: input.messageId,
    status: input.status,
    valid: CONTACT_STATUSES,
    section: 'contact',
  })
}
