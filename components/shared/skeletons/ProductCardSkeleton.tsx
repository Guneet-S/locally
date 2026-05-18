interface ProductCardSkeletonProps {
  row?: boolean;
}

export default function ProductCardSkeleton({ row = false }: ProductCardSkeletonProps) {
  if (row) {
    return (
      <div className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-3">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-[8px] bg-surface-dim" />
        <div className="flex-1">
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-dim" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-surface-dim" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border-[0.5px] border-border-subtle bg-surface">
      <div className="aspect-square w-full animate-pulse bg-surface-dim" />
      <div className="p-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-dim" />
        <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-surface-dim" />
      </div>
    </div>
  );
}
