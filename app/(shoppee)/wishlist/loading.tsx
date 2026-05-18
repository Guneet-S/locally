import StoreCardSkeleton from "@/components/shared/skeletons/StoreCardSkeleton";

export default function WishlistLoading() {
  return (
    <div className="px-4 pb-20 pt-12">
      <div className="h-7 w-24 animate-pulse rounded bg-surface-dim" />
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StoreCardSkeleton key={i} compact />
        ))}
      </div>
    </div>
  );
}
