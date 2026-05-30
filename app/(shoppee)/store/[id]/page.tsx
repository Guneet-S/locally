import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { MapPin, Clock } from "lucide-react";
import WishlistButton from "@/components/shoppee/WishlistButton";
import StoreCTARow from "@/components/shoppee/StoreCTARow";
import ProductCard from "@/components/shoppee/ProductCard";

type Product = {
  id: string;
  name: string;
  price: number | null;
  photo_urls: string[];
  fabric: string | null;
  gsm: number | null;
  product_types: { name: string } | null;
  genders: { name: string } | null;
  product_variants: { qty: number }[];
};

export default async function StorePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  const [{ data: store }, { data: products }] = await Promise.all([
    supabase.from("stores").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("products")
      .select(
        "id, name, price, photo_urls, fabric, gsm, product_types(name), genders(name), product_variants(qty)"
      )
      .eq("store_id", params.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .returns<Product[]>(),
  ]);

  if (!store) notFound();

  // Non-blocking view tracking
  void supabase
    .from("store_views")
    .insert({ store_id: params.id, viewer_id: profile?.id ?? null });

  let wishlisted = false;
  let productWishlistSet = new Set<string>();

  if (profile) {
    const [{ data: storeWishlist }, { data: productWishlistRows }] =
      await Promise.all([
        supabase
          .from("store_wishlists")
          .select("store_id")
          .eq("shoppee_id", profile.id)
          .eq("store_id", params.id)
          .maybeSingle(),
        supabase
          .from("product_wishlist")
          .select("product_id")
          .eq("user_id", profile.id),
      ]);
    wishlisted = !!storeWishlist;
    productWishlistSet = new Set(
      productWishlistRows?.map((r) => r.product_id) ?? []
    );
  }

  const lat = store.lat ?? 0;
  const lng = store.lng ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-shoppee-bg pb-20">
      {/* Banner */}
      <div className="relative">
        {store.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.banner_url}
            alt={store.name}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="h-52 w-full bg-shoppee-muted" />
        )}
        <div className="absolute right-3 top-3">
          <WishlistButton storeId={store.id} initialWishlisted={wishlisted} />
        </div>
      </div>

      <div className="px-4 pt-4">
        <h1 className="font-serif text-h1 text-shoppee-textPrimary">
          {store.name}
        </h1>

        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5">
            <MapPin
              size={14}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-shoppee-textSecondary"
            />
            <p className="text-meta text-shoppee-textSecondary">
              {store.address}
            </p>
          </div>
          {(store.opening_time || store.closing_time) && (
            <div className="flex items-center gap-1.5">
              <Clock
                size={14}
                strokeWidth={1.5}
                className="text-shoppee-textSecondary"
              />
              <p className="text-meta text-shoppee-textSecondary">
                {store.opening_time ?? "—"} – {store.closing_time ?? "—"}
              </p>
            </div>
          )}
        </div>

        {/* Category pills */}
        {(store.categories as string[]).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(store.categories as string[]).map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-shoppee-muted px-2.5 py-1 text-meta text-shoppee-primary"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* CTA buttons: WhatsApp + Directions + Call */}
        <StoreCTARow
          storeId={store.id}
          contactPhone={store.contact_phone}
          whatsappNumber={store.whatsapp_number ?? null}
          lat={lat}
          lng={lng}
        />
      </div>

      {/* Products */}
      <div className="mt-6 px-4">
        <h2 className="font-serif text-h2 text-shoppee-textPrimary">
          Products
        </h2>
        {!products || products.length === 0 ? (
          <p className="mt-3 text-body text-shoppee-textSecondary">
            No products listed yet.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={productWishlistSet.has(product.id)}
                userId={profile?.id ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
