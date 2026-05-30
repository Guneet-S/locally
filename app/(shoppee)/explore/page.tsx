import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExploreSearch from "@/components/shoppee/ExploreSearch";
import StoreCard from "@/components/shoppee/StoreCard";
import { Search } from "lucide-react";

type StoreResult = {
  id: string;
  name: string;
  cover_image_url: string | null;
  banner_url: string | null;
  address: string;
  categories: string[];
};

const GSM_CHIPS = [
  { key: "100-180", label: "100-180 GSM" },
  { key: "180-240", label: "180-240 GSM" },
  { key: "240-300", label: "240-300 GSM" },
  { key: "300+", label: "300+ GSM" },
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const supabase = createClient();

  const stores: StoreResult[] = await (async () => {
    if (!q) return [];

    const pattern = `%${q}%`;

    const [{ data: byName }, { data: matchingProducts }] = await Promise.all([
      supabase
        .from("stores")
        .select("id, name, cover_image_url, banner_url, address, categories")
        .ilike("name", pattern)
        .eq("is_active", true)
        .limit(20)
        .returns<StoreResult[]>(),
      supabase
        .from("products")
        .select("store_id")
        .ilike("name", pattern)
        .limit(20),
    ]);

    const productStoreIds = Array.from(
      new Set(matchingProducts?.map((p) => p.store_id) ?? [])
    );

    let byProduct: StoreResult[] = [];
    if (productStoreIds.length > 0) {
      const { data } = await supabase
        .from("stores")
        .select("id, name, cover_image_url, banner_url, address, categories")
        .in("id", productStoreIds)
        .eq("is_active", true)
        .returns<StoreResult[]>();
      byProduct = data ?? [];
    }

    const seen = new Set<string>();
    const results: StoreResult[] = [];
    for (const s of [...(byName ?? []), ...byProduct]) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        results.push(s);
      }
    }
    return results;
  })();

  return (
    <div className="min-h-screen bg-shoppee-bg px-4 pb-20 pt-12">
      <h1 className="font-serif text-h1 text-shoppee-textPrimary">Explore</h1>
      <div className="mt-4">
        <ExploreSearch initialQ={q} />
      </div>

      {/* GSM filter chips - link to /search?tab=products with gsm filter */}
      <div className="mt-4">
        <p className="text-meta text-shoppee-textSecondary">Filter by GSM</p>
        <div
          className="mt-2 flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {GSM_CHIPS.map((chip) => (
            <Link
              key={chip.key}
              href={`/search?tab=products&gsm=${encodeURIComponent(chip.key)}`}
              className="shrink-0 rounded-full border border-shoppee-border bg-shoppee-muted px-3 py-1 text-meta text-shoppee-textSecondary"
            >
              {chip.label}
            </Link>
          ))}
          <Link
            href="/search?tab=products"
            className="shrink-0 rounded-full border border-shoppee-border bg-transparent px-3 py-1 text-meta text-shoppee-primary"
          >
            Clear all
          </Link>
        </div>
      </div>

      {q && stores.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <Search size={40} strokeWidth={1.5} className="text-shoppee-muted" />
          <p className="mt-3 font-serif text-h3 text-shoppee-textPrimary">
            No results for &ldquo;{q}&rdquo;
          </p>
          <p className="mt-1 text-body text-shoppee-textSecondary">
            Try a different search term.
          </p>
        </div>
      )}

      {!q && (
        <p className="mt-8 text-center text-body text-shoppee-textSecondary">
          Search for stores or styles above.
        </p>
      )}

      {stores.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
