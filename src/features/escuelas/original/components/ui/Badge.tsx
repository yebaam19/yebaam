import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal';

const VARIANTS: Record<BadgeVariant, string> = {
  default:  'bg-slate-100 text-slate-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-800',
  danger:   'bg-red-100 text-red-700',
  info:     'bg-blue-100 text-blue-700',
  purple:   'bg-purple-100 text-purple-700',
  teal:     'bg-teal-100 text-teal-700',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  purple:  'bg-purple-500',
  teal:    'bg-teal-500',
};

export default function Badge({ variant = 'default', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${VARIANTS[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
