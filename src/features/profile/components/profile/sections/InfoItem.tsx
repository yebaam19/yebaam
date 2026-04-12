/**
 * InfoItem Component
 * 
 * Item individual para mostrar información del perfil
 */

interface InfoItemProps {
  icon: any
  label: string
  value: string
  isLink?: boolean
}

export default function InfoItem({ 
  icon: Icon, 
  label, 
  value,
  isLink = false 
}: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {isLink ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  )
}
