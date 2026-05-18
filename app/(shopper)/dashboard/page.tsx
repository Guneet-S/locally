import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Link from "next/link";

function getTodayStartIST(): string {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const nowIST = Date.now() + IST_OFFSET_MS;
  const todayMidnightIST = Math.floor(nowIST / 86400000) * 86400000;
  return new Date(todayMidnightIST - IST_OFFSET_MS).toISOString();
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

  const [
    { count: viewsToday },
    { count: productCount },
    { data: ratingRows },
    { count: wishlistCount },
    { data: recentProducts },
  ] = await Promise.all([
    supabase
      .from("store_views")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .gte("viewed_at", todayStart),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id),
    supabase.from("reviews").select("rating").eq("store_id", store.id),
    supabase
      .from("wishlists")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id),
    supabase
      .from("products")
      .select("id, name, price, sizes, colors, photo_urls")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const avgRating =
    ratingRows && ratingRows.length > 0
      ? (
          ratingRows.reduce((sum, r) => sum + r.rating, 0) / ratingRows.length
        ).toFixed(1)
      : null;

  const stats = [
    { label: "Profile views today", value: String(viewsToday ?? 0) },
    { label: "Items in catalogue", value: String(productCount ?? 0) },
    { label: "Avg rating", value: avgRating ?? "—" },
    { label: "Wishlistings", value: String(wishlistCount ?? 0) },
  ];

  return (
    <div className="px-4 pb-20 pt-10">
      <p className="text-h1 text-text-primary">Hi, {store.name}</p>
      {store.city && (
        <p className="mt-1 text-meta text-text-secondary">{store.city}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-[10px] bg-shopper-light p-4">
            <p className="text-meta text-text-tertiary">{label}</p>
            <p className="mt-1 text-h1 text-shopper-dark">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-h2 text-text-primary">Recent inventory</p>
        <Link href="/inventory/new" className="text-meta text-shopper-primary">
          Add +
        </Link>
      </div>

      {recentProducts && recentProducts.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {recentProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-3"
            >
              {product.photo_urls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.photo_urls[0]}
                  alt={product.name}
                  className="h-14 w-14 rounded-[8px] object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-[8px] bg-surface-muted" />
              )}
              <div className="flex-1">
                <p className="text-h3 text-text-primary">{product.name}</p>
                <p className="mt-0.5 text-meta text-text-secondary">
                  &#8377;{product.price}
                </p>
                {product.sizes.length > 0 && (
                  <p className="mt-0.5 text-meta text-text-tertiary">
                    {product.sizes.join(", ")}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                {product.colors.slice(0, 3).map((color) => (
                  <div
                    key={color}
                    className="h-4 w-4 rounded-full border-[0.5px] border-border-subtle"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center">
          <p className="text-body text-text-tertiary">No products yet.</p>
          <Link
            href="/inventory/new"
            className="mt-2 inline-block text-meta text-shopper-primary"
          >
            Add your first item
          </Link>
        </div>
      )}
    </div>
  );
}
