export default function ProductLoading() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="aspect-square w-full animate-pulse bg-surface-dim" />
      <div className="px-4 pt-4">
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-dim" />
        <div className="mt-2 h-7 w-56 animate-pulse rounded bg-surface-dim" />
        <div className="mt-1 h-6 w-24 animate-pulse rounded bg-surface-dim" />
        <div className="mt-4">
          <div className="h-3 w-12 animate-pulse rounded bg-surface-dim" />
          <div className="mt-2 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-10 animate-pulse rounded-[6px] bg-surface-dim"
              />
            ))}
          </div>
        </div>
        <div className="mt-4">
          <div className="h-3 w-14 animate-pulse rounded bg-surface-dim" />
          <div className="mt-2 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-7 animate-pulse rounded-full bg-surface-dim"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-4 mt-6 h-28 animate-pulse rounded-[10px] bg-surface-dim" />
    </div>
  );
}
