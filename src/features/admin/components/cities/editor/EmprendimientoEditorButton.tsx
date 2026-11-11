'use client'

import { useState, useTransition } from 'react'
import { loadCityEmprendimientoEditor } from '@/features/admin/actions/city-emprendimiento-editor.actions'
import type { AdminEmprendimientoInput } from '@/features/admin/lib/city-emprendimiento-input'
import { AdminEmprendimientoForm } from './AdminEmprendimientoForm'
import { primaryActionStyles } from '@/ui/primary-action-styles'

export function EmprendimientoEditorButton({ cityId, id }: { cityId: string; id?: string }) {
  const [open, setOpen] = useState(false)
  const [initial, setInitial] = useState<AdminEmprendimientoInput>()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  function show() {
    if (!id) { setOpen(true); return }
    setError('')
    startTransition(async () => {
      try {
        const result = await loadCityEmprendimientoEditor(cityId, id)
        if (!result.ok) { setError('No se pudo cargar el emprendimiento.'); return }
        setInitial(result.data)
        setOpen(true)
      } catch { setError('No se pudo cargar. Inténtalo de nuevo.') }
    })
  }
  return <div className="w-full space-y-2">
    {!open && <button type="button" onClick={show} disabled={pending} className={id ? 'rounded-lg border px-3 py-2 text-sm' : primaryActionStyles}>
      {pending ? 'Cargando…' : id ? 'Editar' : 'Agregar emprendimiento'}
    </button>}
    {open && <AdminEmprendimientoForm cityId={cityId} initial={initial} onClose={() => setOpen(false)} />}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>
}
