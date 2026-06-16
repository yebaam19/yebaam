'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import type { BusinessAdmin } from '../../types'

interface Props {
  businessId: string
  admins: BusinessAdmin[]
}

export function BusinessAdminForm({ businessId, admins }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-6 max-w-xl">
      {admins.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sin administradores asignados.</p>
      ) : (
        <ul className="space-y-2">
          {admins.map((admin) => (
            <li key={admin.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
              <div>
                <p className="font-medium">{admin.display_name ?? admin.user_id}</p>
                <p className="text-xs text-muted-foreground">{admin.title ?? ''} {admin.is_primary ? '· Principal' : ''}</p>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {admin.can_manage_menu && <span>Menú</span>}
                {admin.can_manage_media && <span>Media</span>}
                {admin.can_manage_promotions && <span>Promos</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Para añadir administradores, comparte el ID del negocio con el usuario.</p>
    </div>
  )
}
