import StatCardSkeleton from "@/components/shared/skeletons/StatCardSkeleton";
import ProductCardSkeleton from "@/components/shared/skeletons/ProductCardSkeleton";

export default function DashboardLoading() {
  return (
    <div className="px-4 pb-20 pt-10">
      <div className="h-7 w-40 animate-pulse rounded bg-surface-dim" />
      <div className="mt-1 h-3 w-24 animate-pulse rounded bg-surface-dim" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="h-5 w-36 animate-pulse rounded bg-surface-dim" />
        <div className="h-4 w-10 animate-pulse rounded bg-surface-dim" />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProductCardSkeleton key={i} row />
        ))}
      </div>
    </div>
  );
}
