import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { MapPin, Heart } from "lucide-react";

type Store = {
  id: string;
  name: string;
  banner_url: string | null;
  address: string;
  categories: string[];
};

export default async function WishlistPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shoppee");

  const supabase = createClient();

  const { data: wishlistRows } = await supabase
    .from("wishlists")
    .select("store_id")
    .eq("shoppee_id", profile.id)
    .order("created_at", { ascending: false });

  const storeIds = wishlistRows?.map((w) => w.store_id) ?? [];

  const stores: Store[] = [];
  if (storeIds.length > 0) {
    const { data } = await supabase
      .from("stores")
      .select("id, name, banner_url, address, categories")
      .in("id", storeIds)
      .returns<Store[]>();
    if (data) {
      // Preserve wishlist recency order
      const storeMap = new Map(data.map((s) => [s.id, s]));
      for (const id of storeIds) {
        const store = storeMap.get(id);
        if (store) stores.push(store);
      }
    }
  }

  return (
    <div className="px-4 pb-20 pt-12">
      <h1 className="text-h1 text-text-primary">Wishlist</h1>

      {stores.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Heart size={40} strokeWidth={1.5} className="text-surface-dim" />
          <p className="mt-3 text-h3 text-text-primary">No saved stores yet</p>
          <p className="mt-1 text-body text-text-secondary">
            Tap the heart on any store to save it here.
          </p>
          <Link
            href="/home"
            className="mt-6 rounded-[10px] bg-shoppee-primary px-6 py-3 text-button text-white"
          >
            Discover stores
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {stores.map((store) => (
            <Link key={store.id} href={`/store/${store.id}`} className="block">
              <div className="flex gap-3 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-3">
                {store.banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.banner_url}
                    alt={store.name}
                    className="h-16 w-16 shrink-0 rounded-[8px] object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-[8px] bg-shoppee-light" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-h3 text-text-primary">{store.name}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <MapPin
                      size={10}
                      strokeWidth={1.5}
                      className="shrink-0 text-text-tertiary"
                    />
                    <p className="line-clamp-1 text-meta text-text-secondary">
                      {store.address}
                    </p>
                  </div>
                  {store.categories.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {store.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-shoppee-light px-2 py-0.5 text-meta text-shoppee-dark"
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
