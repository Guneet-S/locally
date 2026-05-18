import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExploreSearch from "@/components/shoppee/ExploreSearch";
import { MapPin, Search } from "lucide-react";

type StoreResult = {
  id: string;
  name: string;
  banner_url: string | null;
  address: string;
  categories: string[];
};

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
        .select("id, name, banner_url, address, categories")
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
        .select("id, name, banner_url, address, categories")
        .in("id", productStoreIds)
        .eq("is_active", true)
        .returns<StoreResult[]>();
      byProduct = data ?? [];
    }

    // byName first, then product-matched stores not already included
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
            <Link key={store.id} href={`/store/${store.id}`} className="block">
              <div className="flex gap-3 rounded-lg border border-shoppee-border bg-white p-3 shadow-sm">
                {store.banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.banner_url}
                    alt={store.name}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-shoppee-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-h3 text-shoppee-textPrimary">
                    {store.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <MapPin
                      size={10}
                      strokeWidth={1.5}
                      className="shrink-0 text-shoppee-textSecondary"
                    />
                    <p className="line-clamp-1 text-meta text-shoppee-textSecondary">
                      {store.address}
                    </p>
                  </div>
                  {store.categories.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {store.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-shoppee-muted px-2 py-0.5 text-meta text-shoppee-primary"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
