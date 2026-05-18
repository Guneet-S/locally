import ProductCardSkeleton from "@/components/shared/skeletons/ProductCardSkeleton";

export default function StoreLoading() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="h-52 w-full animate-pulse bg-surface-dim" />
      <div className="px-4 pt-4">
        <div className="h-7 w-48 animate-pulse rounded bg-surface-dim" />
        <div className="mt-3 flex flex-col gap-2">
          <div className="h-3 w-64 animate-pulse rounded bg-surface-dim" />
          <div className="h-3 w-36 animate-pulse rounded bg-surface-dim" />
          <div className="h-3 w-28 animate-pulse rounded bg-surface-dim" />
        </div>
        <div className="mt-4 flex gap-3">
          <div className="h-11 flex-1 animate-pulse rounded-[10px] bg-surface-dim" />
          <div className="h-11 flex-1 animate-pulse rounded-[10px] bg-surface-dim" />
        </div>
      </div>
      <div className="mt-6 px-4">
        <div className="h-6 w-24 animate-pulse rounded bg-surface-dim" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
