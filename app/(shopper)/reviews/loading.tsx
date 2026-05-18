export default function ReviewsLoading() {
  return (
    <div className="px-4 pb-20 pt-10">
      <div className="h-7 w-28 animate-pulse rounded bg-surface-dim" />
      <div className="mt-5 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 animate-pulse rounded bg-surface-dim" />
              <div className="h-3 w-20 animate-pulse rounded bg-surface-dim" />
            </div>
            <div className="mt-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div
                  key={j}
                  className="h-3.5 w-3.5 animate-pulse rounded bg-surface-dim"
                />
              ))}
            </div>
            <div className="mt-2 h-10 animate-pulse rounded bg-surface-dim" />
          </div>
        ))}
      </div>
    </div>
  );
}
