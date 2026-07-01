export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-800/50 rounded-xl ${className}`} />
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-800/50">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-2 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function RequestItemSkeleton() {
  return (
    <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
