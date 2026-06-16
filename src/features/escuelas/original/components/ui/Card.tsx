import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export default function Card({ children, className = '', padding = 'lg' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-[#dfeadf] bg-white shadow-sm ${PADDING[padding]} ${className}`}>
      {children}
    </div>
  );
}
