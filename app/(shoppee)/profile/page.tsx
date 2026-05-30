import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, createClient } from "@/lib/supabase/server";
import ProfileMoreSection from "@/components/shoppee/ProfileMoreSection";

type RecentStore = {
  id: string;
  name: string;
  categories: string[];
  banner_url: string | null;
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shoppee");

  const supabase = createClient();

  async function signOut() {
    "use server";
    const { createClient: makeClient } = await import(
      "@/lib/supabase/server"
    );
    const client = makeClient();
    await client.auth.signOut();
    redirect("/role");
  }

  const initial = profile.full_name?.charAt(0).toUpperCase() ?? "?";

  // Stats
  const [
    { count: savedStoresCount },
    { count: savedProductsCount },
    { data: viewedRows },
  ] = await Promise.all([
    supabase
      .from("store_wishlists")
      .select("*", { count: "exact", head: true })
      .eq("shoppee_id", profile.id),
    supabase
      .from("product_wishlist")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),
    supabase.from("store_views").select("store_id").eq("viewer_id", profile.id),
  ]);

  const storesDiscovered = new Set(viewedRows?.map((v) => v.store_id)).size;

  // Recent activity: last 3 unique stores viewed
  const { data: recentViewRows } = await supabase
    .from("store_views")
    .select("store_id")
    .eq("viewer_id", profile.id)
    .order("viewed_at", { ascending: false })
    .limit(50);

  const seenIds = new Set<string>();
  const recentStoreIds: string[] = [];
  for (const row of recentViewRows ?? []) {
    if (!seenIds.has(row.store_id)) {
      seenIds.add(row.store_id);
      recentStoreIds.push(row.store_id);
      if (recentStoreIds.length === 3) break;
    }
  }

  const recentStores: RecentStore[] = [];
  if (recentStoreIds.length > 0) {
    const { data } = await supabase
      .from("stores")
      .select("id, name, categories, banner_url")
      .in("id", recentStoreIds)
      .returns<RecentStore[]>();
    if (data) {
      const storeMap = new Map(data.map((s) => [s.id, s]));
      for (const id of recentStoreIds) {
        const store = storeMap.get(id);
        if (store) recentStores.push(store);
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-shoppee-bg px-4 pb-24 pt-12">
      <h1 className="font-serif text-h1 text-shoppee-textPrimary">Profile</h1>

      {/* User card */}
      <div className="mt-6 rounded-lg border border-shoppee-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-shoppee-muted">
            <span className="font-serif text-h2 text-shoppee-primary">
              {initial}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-xl text-shoppee-textPrimary">
              {profile.full_name}
            </p>
            <p className="mt-0.5 text-meta text-shoppee-textSecondary">
              {profile.email}
            </p>
            <p className="mt-0.5 text-meta text-shoppee-textSecondary">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex gap-3">
        <div className="flex flex-1 flex-col items-center rounded-lg border border-shoppee-border bg-white p-3 shadow-sm">
          <span className="text-2xl font-bold text-shoppee-primary">
            {(savedStoresCount ?? 0) + (savedProductsCount ?? 0)}
          </span>
          <span className="mt-0.5 text-sm text-shoppee-textSecondary">
            Saved Items
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-lg border border-shoppee-border bg-white p-3 shadow-sm">
          <span className="text-2xl font-bold text-shoppee-primary">
            {storesDiscovered}
          </span>
          <span className="mt-0.5 text-sm text-shoppee-textSecondary">
            Stores Discovered
          </span>
        </div>
      </div>

      {/* My Activity */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-shoppee-textSecondary">
          My Activity
        </p>
        {recentStores.length === 0 ? (
          <p className="text-center text-sm text-shoppee-textSecondary">
            No stores visited yet
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentStores.map((store) => (
              <Link key={store.id} href={`/store/${store.id}`} className="block">
                <div className="flex items-center gap-3 rounded-lg border border-shoppee-border bg-white p-3 shadow-sm">
                  {store.banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.banner_url}
                      alt={store.name}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-shoppee-muted" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-shoppee-textPrimary">
                      {store.name}
                    </p>
                    {store.categories.length > 0 && (
                      <p className="mt-0.5 text-xs text-shoppee-textSecondary">
                        {store.categories[0]}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* More section */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-shoppee-textSecondary">
          More
        </p>
        <ProfileMoreSection
          savedProductsCount={savedProductsCount ?? 0}
          savedStoresCount={savedStoresCount ?? 0}
        />
      </div>

      {/* Logout */}
      <div className="mt-auto pt-8">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg border border-shoppee-primary py-3 text-button text-shoppee-primary"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
