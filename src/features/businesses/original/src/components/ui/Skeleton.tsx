import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string
  height?: string
  circle?: boolean
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Skeleton({
  className,
  width,
  height,
  circle = false,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200',
        circle ? 'rounded-full' : 'rounded-2xl',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <Skeleton height="180px" className="mb-4 w-full" />
      <Skeleton height="20px" width="70%" className="mb-2" />
      <Skeleton height="16px" width="45%" className="mb-4" />
      <Skeleton height="40px" width="100%" />
    </div>
  )
}

export default Skeleton