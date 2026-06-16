import Button from '../../../components/ui/Button'
import Card, { CardContent, CardTitle } from '../../../components/ui/Card'

export interface BusinessCTAProps {
  title?: string
  description?: string
  primaryLabel?: string
  secondaryLabel?: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
  sticky?: boolean
}

export default function BusinessCTA({
  title = '¿Listo para pedir o preguntar?',
  description = 'Abre el canal directo del negocio para resolver dudas o hacer tu pedido.',
  primaryLabel = 'Pedir por WhatsApp',
  secondaryLabel = 'Ver carta',
  onPrimaryClick,
  onSecondaryClick,
  sticky = false,
}: BusinessCTAProps) {
  return (
    <div className={sticky ? 'lg:sticky lg:top-24' : ''}>
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="space-y-5">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" fullWidth onClick={onPrimaryClick}>
              {primaryLabel}
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={onSecondaryClick}
            >
              {secondaryLabel}
            </Button>
          </div>

          <div className="rounded-2xl bg-white/70 p-4 text-sm text-slate-600">
            Contacto simple para pasar del antojo a la acción.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
