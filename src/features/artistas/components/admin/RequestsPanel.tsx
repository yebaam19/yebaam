'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateContactRequestStatus, updateBookingRequestStatus } from '../../actions/request.actions'
import type { ContactRequest, BookingRequest, CollaborationRequest, RequestStatus } from '../../types'

interface Props {
  profileId: string
  requests: {
    contact?: ContactRequest[]
    booking?: BookingRequest[]
    collaboration?: CollaborationRequest[]
  }
}

export function RequestsPanel({ profileId, requests }: Props) {
  const [isPending, startTransition] = useTransition()
  const { contact = [], booking = [], collaboration = [] } = requests

  const total = contact.length + booking.length + collaboration.length

  if (total === 0) {
    return <p className="text-muted-foreground text-sm">Sin solicitudes pendientes.</p>
  }

  return (
    <div className="space-y-6">
      {contact.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">Contacto ({contact.length})</h3>
          <ul className="space-y-2">
            {contact.map((req) => (
              <li key={req.id} className="border border-border rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{req.name}</p>
                    <p className="text-xs text-muted-foreground">{req.email}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-2">{req.message}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-muted text-muted-foreground'}`}>
                    {req.status}
                  </span>
                </div>
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => startTransition(async () => { await updateContactRequestStatus(req.id, 'CONTACTED'); toast.success('Marcado como contactado') })}
                      className="text-xs border border-border rounded px-2 py-1"
                    >
                      Marcar contactado
                    </button>
                    <button
                      onClick={() => startTransition(async () => { await updateContactRequestStatus(req.id, 'ARCHIVED'); toast.success('Archivado') })}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Archivar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {booking.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">Booking ({booking.length})</h3>
          <ul className="space-y-2">
            {booking.map((req) => (
              <li key={req.id} className="border border-border rounded-lg p-3 text-sm">
                <p className="font-medium">{req.name}</p>
                <p className="text-xs text-muted-foreground">{req.email}</p>
                {req.event_date && <p className="text-xs text-muted-foreground">Fecha: {req.event_date}</p>}
                {req.budget && <p className="text-xs text-muted-foreground">Presupuesto: {req.currency} {req.budget.toLocaleString()}</p>}
                <p className="text-muted-foreground mt-1 line-clamp-2">{req.message}</p>
                <div className="flex gap-2 mt-2">
                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => startTransition(async () => { await updateBookingRequestStatus(req.id, 'CONTACTED'); toast.success('Contactado') })}
                      className="text-xs border border-border rounded px-2 py-1"
                    >
                      Contactado
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
