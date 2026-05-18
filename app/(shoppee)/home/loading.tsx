import StoreCardSkeleton from "@/components/shared/skeletons/StoreCardSkeleton";

export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="px-4 pt-12">
        <div className="h-7 w-40 animate-pulse rounded bg-surface-dim" />
        <div className="mt-1 h-3 w-28 animate-pulse rounded bg-surface-dim" />
        <div className="mt-4 h-10 animate-pulse rounded-[10px] bg-surface-dim" />
      </div>
      <div className="mt-4 flex gap-2 overflow-hidden px-4 pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-16 shrink-0 animate-pulse rounded-full bg-surface-dim"
          />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StoreCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
