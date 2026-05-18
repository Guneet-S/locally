export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col px-4 pb-8 pt-12">
      <div className="h-7 w-24 animate-pulse rounded bg-surface-dim" />
      <div className="mt-6 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-4">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-dim" />
        <div className="mt-1.5 h-3 w-48 animate-pulse rounded bg-surface-dim" />
      </div>
    </div>
  );
}
