import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand-green-600)] text-white hover:bg-[var(--brand-green-700)] focus:ring-[color:rgba(22,164,76,0.28)] disabled:bg-[var(--brand-green-300)]',
  secondary:
    'bg-[var(--brand-orange-500)] text-white hover:bg-[var(--brand-orange-600)] focus:ring-[color:rgba(236,132,55,0.24)] disabled:bg-[var(--brand-orange-300)]',
  outline:
    'border border-[color:rgba(22,164,76,0.24)] bg-white text-[var(--brand-green-700)] hover:bg-[var(--brand-green-50)] focus:ring-[color:rgba(22,164,76,0.16)] disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-[rgba(22,164,76,0.08)] hover:text-[var(--brand-green-700)] focus:ring-[color:rgba(22,164,76,0.16)] disabled:text-slate-400',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 disabled:bg-red-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-4',
        'disabled:cursor-not-allowed',
        'shadow-sm',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}

export default Button
