import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Card, { CardContent } from '../../../components/ui/Card'
import { buildVisualImageDataUrl } from '../../../lib/visualImage'

export interface AdminProductRow {
  id: number | string
  name: string
  category?: string
  price: number | string
  isActive: boolean
  imageUrl?: string
}

interface ProductTableProps {
  items: AdminProductRow[]
  onEdit?: (id: number | string) => void
  onToggleStatus?: (id: number | string) => void
}

function formatPrice(value: number | string) {
  const numericValue = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numericValue)
}

export default function ProductTable({
  items,
  onEdit,
  onToggleStatus,
}: ProductTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-5 py-4 text-sm font-semibold text-slate-700">Producto</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-700">Sección</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-700">Precio</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-700">Estado</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || buildVisualImageDataUrl(item.name, item.category || 'Producto')}
                        alt={item.name}
                        className="h-12 w-12 rounded-2xl object-cover"
                      />

                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {item.category || 'Sin sección'}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {formatPrice(item.price)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant={item.isActive ? 'success' : 'neutral'}>
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => onEdit?.(item.id)}>
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => onToggleStatus?.(item.id)}>
                        {item.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                    Aún no hay productos creados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
