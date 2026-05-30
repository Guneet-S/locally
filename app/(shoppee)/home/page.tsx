import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import HomeSearch from "@/components/shoppee/HomeSearch";
import WishlistButton from "@/components/shoppee/WishlistButton";
import StoreCard from "@/components/shoppee/StoreCard";
import { MapPin } from "lucide-react";

const CATEGORIES = [
  "Men",
  "Women",
  "Kids",
  "Ethnic",
  "Casual",
  "Formal",
  "Western",
];

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
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
  const categoryFilter = searchParams.category;

  const { data: stores } = await supabase
    .rpc("nearby_stores", {
      lat,
      lng,
      radius_m: 5000,
      ...(categoryFilter ? { category_filter: categoryFilter } : {}),
    })
    .returns<NearbyStore[]>();

  const storeIds = stores?.map((s) => s.id) ?? [];
  const { data: wishlistRows } =
    storeIds.length > 0
      ? await supabase
          .from("store_wishlists")
          .select("store_id")
          .eq("shoppee_id", profile.id)
          .in("store_id", storeIds)
      : { data: [] as { store_id: string }[] };

  const wishlistSet = new Set(wishlistRows?.map((w) => w.store_id) ?? []);

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

      {/* Category filters */}
      <div
        className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        <Link
          href="/home"
          className={`shrink-0 rounded-full border px-3 py-1 text-meta ${
            !categoryFilter
              ? "border-shoppee-primary bg-shoppee-primary text-white"
              : "border-shoppee-border bg-shoppee-muted text-shoppee-textSecondary"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/home?category=${cat}`}
            className={`shrink-0 rounded-full border px-3 py-1 text-meta ${
              categoryFilter === cat
                ? "border-shoppee-primary bg-shoppee-primary text-white"
                : "border-shoppee-border bg-shoppee-muted text-shoppee-textSecondary"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Store list */}
      <div className="mt-4 flex flex-col gap-3 px-4">
        {!stores || stores.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <MapPin size={40} strokeWidth={1.5} className="text-shoppee-muted" />
            <p className="mt-3 text-h3 font-serif text-shoppee-textPrimary">
              No stores found nearby
            </p>
            <p className="mt-1 text-body text-shoppee-textSecondary">
              Try a different category or expand your area.
            </p>
          </div>
        ) : (
          stores.map((store) => (
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
              {/* Wishlist heart overlay on card image */}
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
    </div>
  );
}
