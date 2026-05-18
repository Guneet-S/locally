interface StoreCardSkeletonProps {
  compact?: boolean;
}

export default function StoreCardSkeleton({ compact = false }: StoreCardSkeletonProps) {
  if (compact) {
    return (
      <div className="flex gap-3 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-3">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-[8px] bg-surface-dim" />
        <div className="flex-1 py-1">
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-dim" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-dim" />
          <div className="mt-2 flex gap-1">
            <div className="h-4 w-12 animate-pulse rounded-full bg-surface-dim" />
            <div className="h-4 w-12 animate-pulse rounded-full bg-surface-dim" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border-[0.5px] border-border-subtle bg-surface">
      <div className="h-36 w-full animate-pulse bg-surface-dim" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-dim" />
          <div className="h-4 w-10 animate-pulse rounded-full bg-surface-dim" />
        </div>
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-dim" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-3 w-8 animate-pulse rounded bg-surface-dim" />
          <div className="h-3 w-10 animate-pulse rounded bg-surface-dim" />
        </div>
      </div>
    </div>
  );
}
