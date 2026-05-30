import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import HomeSearch from "@/components/shoppee/HomeSearch";
import WishlistButton from "@/components/shoppee/WishlistButton";
import StoreCard from "@/components/shoppee/StoreCard";
import { MapPin } from "lucide-react";

const CATEGORIES = ["Men", "Women", "Kids", "Ethnic", "Casual", "Western"];

type NearbyStore = {
  id: string;
  name: string;
  cover_image_url: string | null;
  banner_url: string | null;
  address: string;
  categories: string[];
  is_open_now: boolean;
  distance_m: number;
  avg_rating: number;
};

type TrendingRow = { store_id: string; score: number };
type RecentRow = { store_id: string; last_product_added_at: string };

type StoreRow = {
  id: string;
  name: string;
  cover_image_url: string | null;
  banner_url: string | null;
  categories: string[];
};

type NewArrivalProduct = {
  id: string;
  name: string;
  photo_urls: string[];
  store_id: string;
};

export default async function HomePage() {
  const cookieStore = cookies();
  const locationCookie = cookieStore.get("shoppee_location")?.value;
  if (!locationCookie) redirect("/location");

  let lat: number, lng: number;
  try {
    ({ lat, lng } = JSON.parse(decodeURIComponent(locationCookie)));
  } catch {
    redirect("/location");
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shoppee");

  const supabase = createClient();

  // Run base queries in parallel
  const [
    { data: nearbyStores },
    { data: trendingRows },
    { data: recentRows },
  ] = await Promise.all([
    supabase
      .rpc("nearby_stores", { lat, lng, radius_m: 5000 })
      .returns<NearbyStore[]>(),
    supabase.rpc("trending_stores", { limit_n: 6 }).returns<TrendingRow[]>(),
    supabase
      .rpc("recently_updated_stores", { limit_n: 6 })
      .returns<RecentRow[]>(),
  ]);

  const nearbyList = nearbyStores ?? [];
  const nearbyIds = nearbyList.map((s) => s.id);
  const distanceById = new Map<string, number>(
    nearbyList.map((s) => [s.id, s.distance_m])
  );

  // Secondary queries (depend on above)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    { data: newArrivals },
    { data: trendingStores },
    { data: recentStores },
    { data: wishlistRows },
  ] = await Promise.all([
    nearbyIds.length > 0
      ? supabase
          .from("products")
          .select("id, name, photo_urls, store_id")
          .in("store_id", nearbyIds)
          .eq("status", "active")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(12)
          .returns<NewArrivalProduct[]>()
      : Promise.resolve({ data: [] as NewArrivalProduct[] }),
    trendingRows && trendingRows.length > 0
      ? supabase
          .from("stores")
          .select("id, name, cover_image_url, banner_url, categories")
          .in(
            "id",
            trendingRows.map((r) => r.store_id)
          )
          .eq("is_active", true)
          .returns<StoreRow[]>()
      : Promise.resolve({ data: [] as StoreRow[] }),
    recentRows && recentRows.length > 0
      ? supabase
          .from("stores")
          .select("id, name, cover_image_url, banner_url, categories")
          .in(
            "id",
            recentRows.map((r) => r.store_id)
          )
          .eq("is_active", true)
          .returns<StoreRow[]>()
      : Promise.resolve({ data: [] as StoreRow[] }),
    nearbyIds.length > 0
      ? supabase
          .from("store_wishlists")
          .select("store_id")
          .eq("shoppee_id", profile.id)
          .in("store_id", nearbyIds)
      : Promise.resolve({ data: [] as { store_id: string }[] }),
  ]);

  const wishlistSet = new Set(
    (wishlistRows ?? []).map((w) => w.store_id) ?? []
  );

  // Map store id -> store name for new arrivals overlay
  const storeNameMap = new Map<string, string>(
    nearbyList.map((s) => [s.id, s.name])
  );

  // Sort trending by score order
  const trendingScored = (trendingRows ?? []).map((r) => ({
    ...r,
    store: (trendingStores ?? []).find((s) => s.id === r.store_id) ?? null,
  }));
  const trendingOrdered = trendingScored
    .filter((t): t is { store_id: string; score: number; store: StoreRow } =>
      Boolean(t.store)
    )
    .map((t) => t.store);

  // Sort recent by recency order
  const recentScored = (recentRows ?? []).map((r) => ({
    ...r,
    store: (recentStores ?? []).find((s) => s.id === r.store_id) ?? null,
  }));
  const recentOrdered = recentScored
    .filter(
      (t): t is { store_id: string; last_product_added_at: string; store: StoreRow } =>
        Boolean(t.store)
    )
    .map((t) => t.store);

  const newArrivalList = newArrivals ?? [];
  const browseAll = nearbyList.slice(0, 20);

  return (
    <div className="flex min-h-screen flex-col bg-shoppee-bg pb-20">
      <div className="px-4 pt-12">
        <h1 className="font-serif text-h1 text-shoppee-textPrimary">
          Shops near you
        </h1>
        <p className="mt-0.5 text-meta text-shoppee-textSecondary">
          {profile.full_name}
        </p>
        <div className="mt-4">
          <HomeSearch />
        </div>
      </div>

      {/* Rail a: New Arrivals near you */}
      {newArrivalList.length > 0 && (
        <section>
          <div className="mt-6 flex items-center justify-between px-4">
            <h2 className="font-serif text-h2 text-shoppee-textPrimary">
              New Arrivals near you
            </h2>
            <Link
              href="/search?tab=products"
              className="text-meta text-shoppee-primary"
            >
              See all
            </Link>
          </div>
          <div
            className="mt-3 flex gap-3 overflow-x-auto px-4"
            style={{ scrollbarWidth: "none" }}
          >
            {newArrivalList.map((p) => {
              const storeName = storeNameMap.get(p.store_id) ?? "";
              const distance = distanceById.get(p.store_id);
              const distLabel =
                distance !== undefined
                  ? distance < 1000
                    ? `${Math.round(distance)}m`
                    : `${(distance / 1000).toFixed(1)} km`
                  : null;
              const photo = p.photo_urls?.[0] ?? null;

              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="relative block h-[180px] w-[180px] shrink-0 overflow-hidden rounded-[10px] border border-shoppee-border bg-white"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-shoppee-muted" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="font-serif text-meta text-white line-clamp-1">
                      {storeName}
                    </p>
                    {distLabel && (
                      <p className="text-[10px] text-white/80">{distLabel}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Rail b: Trending shops */}
      {trendingOrdered.length > 0 && (
        <section>
          <div className="mt-6 flex items-center justify-between px-4">
            <h2 className="font-serif text-h2 text-shoppee-textPrimary">
              Trending shops
            </h2>
            <Link
              href="/search?tab=stores"
              className="text-meta text-shoppee-primary"
            >
              See all
            </Link>
          </div>
          <div
            className="mt-3 flex gap-3 overflow-x-auto px-4"
            style={{ scrollbarWidth: "none" }}
          >
            {trendingOrdered.map((s) => (
              <div key={s.id} className="w-[200px] shrink-0">
                <StoreCard store={s} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rail c: Just dropped */}
      {recentOrdered.length > 0 && (
        <section>
          <div className="mt-6 flex items-center justify-between px-4">
            <h2 className="font-serif text-h2 text-shoppee-textPrimary">
              Just dropped
            </h2>
            <Link
              href="/search?tab=stores"
              className="text-meta text-shoppee-primary"
            >
              See all
            </Link>
          </div>
          <div
            className="mt-3 flex gap-3 overflow-x-auto px-4"
            style={{ scrollbarWidth: "none" }}
          >
            {recentOrdered.map((s) => (
              <div key={s.id} className="w-[200px] shrink-0">
                <StoreCard store={s} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rail d: Shop by category */}
      <section>
        <div className="mt-6 flex items-center justify-between px-4">
          <h2 className="font-serif text-h2 text-shoppee-textPrimary">
            Shop by category
          </h2>
        </div>
        <div
          className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/explore?gender=${cat}`}
              className="shrink-0 rounded-full border border-shoppee-primary bg-shoppee-primary px-3 py-1 text-meta text-white"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Rail e: Browse all nearby */}
      <section>
        <div className="mt-6 flex items-center justify-between px-4">
          <h2 className="font-serif text-h2 text-shoppee-textPrimary">
            Browse all nearby
          </h2>
        </div>
        <div className="mt-3 flex flex-col gap-3 px-4">
          {browseAll.length === 0 ? (
            <div className="mt-8 flex flex-col items-center text-center">
              <MapPin
                size={40}
                strokeWidth={1.5}
                className="text-shoppee-muted"
              />
              <p className="mt-3 text-h3 font-serif text-shoppee-textPrimary">
                No stores found nearby
              </p>
              <p className="mt-1 text-body text-shoppee-textSecondary">
                Try expanding your area.
              </p>
            </div>
          ) : (
            browseAll.map((store) => (
              <div key={store.id} className="relative">
                <StoreCard
                  store={{
                    id: store.id,
                    name: store.name,
                    cover_image_url: store.cover_image_url,
                    banner_url: store.banner_url,
                    categories: store.categories,
                    is_open_now: store.is_open_now,
                    distance_m: store.distance_m,
                  }}
                  wishlisted={wishlistSet.has(store.id)}
                  showWishlist
                />
                <div className="absolute right-2 top-2">
                  <WishlistButton
                    storeId={store.id}
                    initialWishlisted={wishlistSet.has(store.id)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
