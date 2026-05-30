import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { Search } from "lucide-react";
import SearchInput from "@/components/shoppee/SearchInput";
import ProductCard from "@/components/shoppee/ProductCard";
import StoreCard from "@/components/shoppee/StoreCard";

type Tab = "products" | "stores";

type ProductRow = {
  id: string;
  name: string;
  price: number | null;
  photo_urls: string[];
  fabric: string | null;
  gsm: number | null;
  gender_id: number | null;
  category_id: number | null;
  product_types: { name: string } | null;
  genders: { name: string } | null;
  product_variants: { qty: number }[];
};

type StoreRow = {
  id: string;
  name: string;
  cover_image_url: string | null;
  banner_url: string | null;
  categories: string[];
  city: string | null;
};

type GenderRow = { id: number; name: string };
type CategoryRow = { id: number; name: string; gender_id: number };

const GSM_RANGES: { key: string; label: string; min: number; max: number | null }[] = [
  { key: "100-180", label: "100-180 GSM", min: 100, max: 180 },
  { key: "180-240", label: "180-240 GSM", min: 181, max: 240 },
  { key: "240-300", label: "240-300 GSM", min: 241, max: 300 },
  { key: "300+", label: "300+ GSM", min: 301, max: null },
];

function buildLink(
  base: { q?: string; tab: Tab; gender?: string; category?: string; gsm?: string; city?: string },
  override: Partial<{ q: string; tab: Tab; gender: string; category: string; gsm: string; city: string }>
): string {
  const params = new URLSearchParams();
  const merged = { ...base, ...override };
  if (merged.q) params.set("q", merged.q);
  if (merged.tab) params.set("tab", merged.tab);
  if (merged.gender) params.set("gender", merged.gender);
  if (merged.category) params.set("category", merged.category);
  if (merged.gsm) params.set("gsm", merged.gsm);
  if (merged.city) params.set("city", merged.city);
  return `/search?${params.toString()}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    tab?: string;
    gender?: string;
    category?: string;
    gsm?: string;
    city?: string;
  };
}) {
  const q = (searchParams.q ?? "").trim();
  const tab: Tab = searchParams.tab === "stores" ? "stores" : "products";
  const genderFilter = searchParams.gender ?? "";
  const categoryFilter = searchParams.category ?? "";
  const gsmFilter = searchParams.gsm ?? "";
  const cityFilter = searchParams.city ?? "";

  const supabase = createClient();
  const profile = await getCurrentProfile();

  // Fetch taxonomy for chips
  const [{ data: genders }, { data: categories }] = await Promise.all([
    supabase.from("genders").select("id, name").order("id").returns<GenderRow[]>(),
    supabase
      .from("product_categories")
      .select("id, name, gender_id")
      .order("id")
      .returns<CategoryRow[]>(),
  ]);

  const baseParams = {
    q,
    tab,
    gender: genderFilter,
    category: categoryFilter,
    gsm: gsmFilter,
    city: cityFilter,
  };

  // Build results
  let productResults: ProductRow[] = [];
  let storeResults: StoreRow[] = [];
  let productWishlistSet = new Set<string>();

  if (tab === "products") {
    let query = supabase
      .from("products")
      .select(
        "id, name, price, photo_urls, fabric, gsm, gender_id, category_id, product_types(name), genders(name), product_variants(qty)"
      )
      .eq("status", "active");

    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`name.ilike.${pattern},fabric.ilike.${pattern}`);
    }
    if (genderFilter) {
      const g = (genders ?? []).find(
        (gg) => gg.name.toLowerCase() === genderFilter.toLowerCase()
      );
      if (g) query = query.eq("gender_id", g.id);
    }
    if (categoryFilter) {
      const c = (categories ?? []).find(
        (cc) => cc.name.toLowerCase() === categoryFilter.toLowerCase()
      );
      if (c) query = query.eq("category_id", c.id);
    }
    if (gsmFilter) {
      const range = GSM_RANGES.find((r) => r.key === gsmFilter);
      if (range) {
        query = query.gte("gsm", range.min);
        if (range.max !== null) query = query.lte("gsm", range.max);
      }
    }

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<ProductRow[]>();
    productResults = data ?? [];

    if (profile && productResults.length > 0) {
      const { data: wishRows } = await supabase
        .from("product_wishlist")
        .select("product_id")
        .eq("user_id", profile.id)
        .in(
          "product_id",
          productResults.map((p) => p.id)
        );
      productWishlistSet = new Set(
        (wishRows ?? []).map((r) => r.product_id)
      );
    }
  } else {
    let query = supabase
      .from("stores")
      .select("id, name, cover_image_url, banner_url, categories, city")
      .eq("is_active", true);

    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`name.ilike.${pattern},categories.cs.{${q}}`);
    }
    if (cityFilter) {
      query = query.ilike("city", `%${cityFilter}%`);
    }

    const { data } = await query.limit(40).returns<StoreRow[]>();
    storeResults = data ?? [];
  }

  const showEmptyHero = !q && !genderFilter && !categoryFilter && !gsmFilter && !cityFilter;

  return (
    <div className="min-h-screen bg-shoppee-bg px-4 pb-20 pt-10">
      <h1 className="font-serif text-h1 text-shoppee-textPrimary">Search</h1>

      <div className="mt-4">
        <SearchInput defaultValue={q} tab={tab} />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex border-b border-shoppee-border">
        <Link
          href={buildLink(baseParams, { tab: "products" })}
          className={`flex-1 pb-2 text-center text-body ${
            tab === "products"
              ? "border-b-2 border-shoppee-primary font-semibold text-shoppee-primary"
              : "text-shoppee-textSecondary"
          }`}
        >
          Products
        </Link>
        <Link
          href={buildLink(baseParams, { tab: "stores" })}
          className={`flex-1 pb-2 text-center text-body ${
            tab === "stores"
              ? "border-b-2 border-shoppee-primary font-semibold text-shoppee-primary"
              : "text-shoppee-textSecondary"
          }`}
        >
          Stores
        </Link>
      </div>

      {/* Filter chips */}
      {tab === "products" ? (
        <div className="mt-4 flex flex-col gap-2">
          {/* Gender chips */}
          <div
            className="flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {(genders ?? []).map((g) => {
              const active = genderFilter.toLowerCase() === g.name.toLowerCase();
              return (
                <Link
                  key={g.id}
                  href={buildLink(baseParams, {
                    gender: active ? "" : g.name,
                    category: "",
                  })}
                  className={`shrink-0 rounded-full border px-3 py-1 text-meta ${
                    active
                      ? "border-shoppee-primary bg-shoppee-primary text-white"
                      : "border-shoppee-border bg-shoppee-muted text-shoppee-textSecondary"
                  }`}
                >
                  {g.name}
                </Link>
              );
            })}
          </div>

          {/* GSM chips */}
          <div
            className="flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {GSM_RANGES.map((r) => {
              const active = gsmFilter === r.key;
              return (
                <Link
                  key={r.key}
                  href={buildLink(baseParams, { gsm: active ? "" : r.key })}
                  className={`shrink-0 rounded-full border px-3 py-1 text-meta ${
                    active
                      ? "border-shoppee-primary bg-shoppee-primary text-white"
                      : "border-shoppee-border bg-shoppee-muted text-shoppee-textSecondary"
                  }`}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>

          {/* Clear all */}
          {(genderFilter || categoryFilter || gsmFilter) && (
            <Link
              href={buildLink(
                { q, tab },
                { gender: "", category: "", gsm: "" }
              )}
              className="self-start text-meta text-shoppee-primary"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <form
            action="/search"
            method="get"
            className="flex items-center gap-2"
          >
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="tab" value="stores" />
            <input
              name="city"
              defaultValue={cityFilter}
              placeholder="Filter by city..."
              className="flex-1 rounded-[10px] border border-shoppee-border bg-shoppee-muted px-3 py-2 text-meta text-shoppee-textPrimary outline-none"
            />
            <button
              type="submit"
              className="rounded-[10px] bg-shoppee-primary px-3 py-2 text-meta text-white"
            >
              Apply
            </button>
          </form>
          {cityFilter && (
            <Link
              href={buildLink({ q, tab }, { city: "" })}
              className="self-start text-meta text-shoppee-primary"
            >
              Clear filters
            </Link>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mt-5">
        {showEmptyHero ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <Search
              size={40}
              strokeWidth={1.5}
              className="text-shoppee-muted"
            />
            <p className="mt-3 font-serif text-h3 text-shoppee-textPrimary">
              Search for products or stores
            </p>
            <p className="mt-1 text-body text-shoppee-textSecondary">
              Type a name, fabric, or category above.
            </p>
          </div>
        ) : tab === "products" ? (
          productResults.length === 0 ? (
            <div className="mt-12 flex flex-col items-center text-center">
              <p className="font-serif text-h3 text-shoppee-textPrimary">
                No products found
              </p>
              <p className="mt-1 text-body text-shoppee-textSecondary">
                Try a different keyword or remove filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {productResults.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlisted={productWishlistSet.has(p.id)}
                  userId={profile?.id ?? null}
                />
              ))}
            </div>
          )
        ) : storeResults.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <p className="font-serif text-h3 text-shoppee-textPrimary">
              No stores found
            </p>
            <p className="mt-1 text-body text-shoppee-textSecondary">
              Try a different keyword or remove filters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {storeResults.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
