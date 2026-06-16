type BrandLogoVariant = 'green' | 'white'

export interface BrandLogoProps {
  variant?: BrandLogoVariant
  className?: string
  compact?: boolean
}

const sources: Record<BrandLogoVariant, string> = {
  green: '/brand/yebaam-logo-green.svg',
  white: '/brand/yebaam-logo-white.svg',
}

export default function BrandLogo({
  variant = 'green',
  className = '',
  compact = false,
}: BrandLogoProps) {
  return (
    <img
      src={compact ? '/favicon.svg' : sources[variant]}
      alt="Yebaam"
      className={className}
      draggable={false}
    />
  )
}
