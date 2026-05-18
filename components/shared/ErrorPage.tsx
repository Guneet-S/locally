export default function ErrorPage({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-h2 text-text-primary">Something went wrong</p>
      <p className="mt-2 text-body text-text-secondary">
        We hit an unexpected error. Please try again.
      </p>
      <button
        onClick={onReset}
        className="mt-6 rounded-[10px] border border-text-primary px-6 py-3 text-button text-text-primary"
      >
        Try again
      </button>
    </div>
  );
}
