import ProductCardSkeleton from "@/components/shared/skeletons/ProductCardSkeleton";

export default function InventoryLoading() {
  return (
    <div className="px-4 pb-20 pt-10">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 animate-pulse rounded bg-surface-dim" />
        <div className="h-8 w-16 animate-pulse rounded-[10px] bg-surface-dim" />
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProductCardSkeleton key={i} row />
        ))}
      </div>
    </div>
  );
}
