export default function TestTokensPage() {
  return (
    <main className="px-4 py-8 space-y-8">
      <h1 className="text-h1 text-text-primary">Design Token Test</h1>

      {/* Role color buttons */}
      <section className="space-y-4">
        <h2 className="text-h2 text-text-secondary">Role Buttons</h2>
        <div className="space-y-2">
          <button className="w-full rounded-[10px] bg-shopper-primary py-3 text-button text-white">
            Shopper Primary
          </button>
          <button className="w-full rounded-[10px] bg-shopper-light py-3 text-button text-shopper-dark">
            Shopper Light
          </button>
          <button className="w-full rounded-[10px] bg-shoppee-primary py-3 text-button text-white">
            Shoppee Primary
          </button>
          <button className="w-full rounded-[10px] bg-shoppee-light py-3 text-button text-shoppee-dark">
            Shoppee Light
          </button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-h2 text-text-secondary">Role Badges</h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-shopper-light px-3 py-1 text-meta text-shopper-dark">Shopper</span>
          <span className="rounded-full bg-shopper-primary px-3 py-1 text-meta text-white">Shopper Dark</span>
          <span className="rounded-full bg-shoppee-light px-3 py-1 text-meta text-shoppee-dark">Shoppee</span>
          <span className="rounded-full bg-shoppee-primary px-3 py-1 text-meta text-white">Shoppee Dark</span>
          <span className="rounded-full bg-red-50 px-3 py-1 text-meta text-danger">Closed</span>
          <span className="rounded-full bg-shoppee-light px-3 py-1 text-meta text-shoppee-dark">Open</span>
        </div>
      </section>

      {/* Typography tokens */}
      <section className="space-y-4">
        <h2 className="text-h2 text-text-secondary">Typography</h2>
        <div className="space-y-2 border border-border-subtle rounded-[10px] p-4">
          <p className="text-h1 text-text-primary">text-h1 — Page title (22px/500)</p>
          <p className="text-h1-mobile text-text-primary">text-h1-mobile — Mobile title (20px/500)</p>
          <p className="text-h2 text-text-secondary">text-h2 — Section title (18px/500)</p>
          <p className="text-h3 text-text-secondary">text-h3 — Card title (16px/500)</p>
          <p className="text-body text-text-primary">text-body — Paragraph text (16px/400)</p>
          <p className="text-button text-text-secondary">text-button — Button label (12px/500)</p>
          <p className="text-meta text-text-tertiary">text-meta — Labels, metadata (11px/400)</p>
        </div>
      </section>

      {/* Surface colors */}
      <section className="space-y-4">
        <h2 className="text-h2 text-text-secondary">Surfaces</h2>
        <div className="flex gap-2">
          <div className="flex-1 h-12 rounded-[10px] bg-surface border border-border-subtle flex items-center justify-center text-meta text-text-tertiary">surface</div>
          <div className="flex-1 h-12 rounded-[10px] bg-surface-muted flex items-center justify-center text-meta text-text-tertiary">muted</div>
          <div className="flex-1 h-12 rounded-[10px] bg-surface-dim flex items-center justify-center text-meta text-text-tertiary">dim</div>
        </div>
      </section>
    </main>
  );
}
