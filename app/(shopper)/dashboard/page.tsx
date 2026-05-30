import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Store, Folder } from "lucide-react";
import DashboardShareButton from "@/components/shopper/DashboardShareButton";

function getTodayStartIST(): string {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const nowIST = Date.now() + IST_OFFSET_MS;
  const todayMidnightIST = Math.floor(nowIST / 86400000) * 86400000;
  return new Date(todayMidnightIST - IST_OFFSET_MS).toISOString();
}

function getDaysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, city")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!store) redirect("/setup");

  const todayStart = getTodayStartIST();
  const thirtyDaysAgo = getDaysAgoISO(30);

  // First fetch product IDs for this store (needed for product_views/wishlist counts)
  const { data: productRows } = await supabase
    .from("products")
    .select("id, status")
    .eq("store_id", store.id);

  const productIds = (productRows ?? []).map((p) => p.id);
  const activeProductCount = (productRows ?? []).filter(
    (p) => p.status === "active"
  ).length;

  // Run analytics queries in parallel
  const [
    { count: storeViewsToday },
    { count: productViewsToday },
    { count: storeWishToday },
    { count: productWishToday },
    { count: directionEvents },
    { count: whatsappEvents },
    { count: callEvents },
    { data: variants },
  ] = await Promise.all([
    supabase
      .from("store_views")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .gte("viewed_at", todayStart),
    productIds.length > 0
      ? supabase
          .from("product_views")
          .select("*", { count: "exact", head: true })
          .in("product_id", productIds)
          .gte("viewed_at", todayStart)
      : Promise.resolve({ count: 0 } as { count: number }),
    supabase
      .from("store_wishlists")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .gte("created_at", todayStart),
    productIds.length > 0
      ? supabase
          .from("product_wishlist")
          .select("*", { count: "exact", head: true })
          .in("product_id", productIds)
          .gte("created_at", todayStart)
      : Promise.resolve({ count: 0 } as { count: number }),
    supabase
      .from("contact_events")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("event_type", "directions")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("contact_events")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("event_type", "whatsapp")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("contact_events")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("event_type", "call")
      .gte("created_at", thirtyDaysAgo),
    productIds.length > 0
      ? supabase
          .from("product_variants")
          .select("product_id, qty")
          .in("product_id", productIds)
      : Promise.resolve({ data: [] as { product_id: string; qty: number }[] }),
  ]);

  // Compute low/out stock
  const variantsByProduct = new Map<string, number>();
  for (const v of (variants as { product_id: string; qty: number }[]) ?? []) {
    variantsByProduct.set(
      v.product_id,
      (variantsByProduct.get(v.product_id) ?? 0) + v.qty
    );
  }
  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const pid of productIds) {
    const total = variantsByProduct.get(pid) ?? 0;
    if (total === 0) outOfStockCount += 1;
    else if (total <= 5) lowStockCount += 1;
  }

  const wishlistToday = (storeWishToday ?? 0) + (productWishToday ?? 0);
  const publicStoreUrl = `/store/${store.id}`;

  return (
    <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24 pt-10">
      <p className="text-h1 text-text-primary">Hi, {store.name}</p>
      {store.city && (
        <p className="mt-1 text-meta text-text-secondary">{store.city}</p>
      )}

      {/* Today */}
      <p className="mt-6 text-h3 text-text-primary">Today</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <StatCard label="Store views" value={storeViewsToday ?? 0} />
        <StatCard label="Product views" value={productViewsToday ?? 0} />
        <StatCard label="Wishlists" value={wishlistToday} />
      </div>

      {/* Last 30 days */}
      <p className="mt-6 text-h3 text-text-primary">Last 30 days</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <StatCard label="Directions" value={directionEvents ?? 0} />
        <StatCard label="WhatsApp" value={whatsappEvents ?? 0} />
        <StatCard label="Calls" value={callEvents ?? 0} />
      </div>

      {/* Inventory */}
      <p className="mt-6 text-h3 text-text-primary">Inventory</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <StatCard label="Active" value={activeProductCount} />
        <StatCard label="Low stock" value={lowStockCount} />
        <StatCard label="Out of stock" value={outOfStockCount} />
      </div>

      {/* Quick actions */}
      <p className="mt-6 text-h3 text-text-primary">Quick actions</p>
      <div className="mt-2 flex flex-col gap-2">
        <Link
          href="/inventory/new"
          className="flex items-center justify-center gap-2 rounded-[10px] bg-shopper-primary py-3 text-button text-white"
        >
          <Plus size={16} strokeWidth={1.5} />
          Add product
        </Link>
        <DashboardShareButton
          storeName={store.name}
          storeUrl={publicStoreUrl}
        />
        <Link
          href="/collections"
          className="flex items-center justify-center gap-2 rounded-[10px] border border-shopper-primary py-3 text-button text-shopper-primary"
        >
          <Folder size={16} strokeWidth={1.5} />
          Manage collections
        </Link>
        <Link
          href={publicStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-[10px] border border-shopper-primary py-3 text-button text-shopper-primary"
        >
          <Store size={16} strokeWidth={1.5} />
          View store
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] bg-shopper-light p-3">
      <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
        {label}
      </p>
      <p className="mt-1 text-h2 text-shopper-dark">{value}</p>
    </div>
  );
}

