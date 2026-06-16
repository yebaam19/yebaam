export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-brand-mintLight ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-card animate-pulse">
      <div className="h-40 rounded-xl bg-brand-mintLight mb-4" />
      <div className="h-4 rounded bg-brand-mintLight mb-2 w-3/4" />
      <div className="h-3 rounded bg-brand-mintLight w-1/2" />
    </div>
  );
}
