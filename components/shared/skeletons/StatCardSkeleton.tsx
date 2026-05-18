export default function StatCardSkeleton() {
  return (
    <div className="rounded-[10px] bg-shopper-light p-4">
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface-dim" />
      <div className="mt-2 h-7 w-1/3 animate-pulse rounded bg-surface-dim" />
    </div>
  );
}
