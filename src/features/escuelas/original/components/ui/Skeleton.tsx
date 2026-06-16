interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
}

export default function Skeleton({ width, height, className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#dfeadf] bg-white shadow-sm" aria-hidden="true">
      <div className="h-48 w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <Skeleton height="18px" width="70%" />
        <Skeleton height="13px" width="40%" />
        <div className="pt-2">
          <Skeleton height="13px" width="90%" />
          <Skeleton height="13px" width="75%" className="mt-2" />
        </div>
        <div className="pt-2">
          <Skeleton height="36px" width="120px" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="13px" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}
