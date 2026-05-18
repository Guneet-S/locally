import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { MapPin, Clock, Phone } from "lucide-react";
import WishlistButton from "@/components/shoppee/WishlistButton";

type Product = {
  id: string;
  name: string;
  price: number;
  photo_urls: string[];
  category: string;
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
      .select("id, name, price, photo_urls, category")
      .eq("store_id", params.id)
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .returns<Product[]>(),
  ]);

  if (!store) notFound();

  // Non-blocking view tracking
  void supabase
    .from("store_views")
    .insert({ store_id: params.id, viewer_id: profile?.id ?? null });

  let wishlisted = false;
  if (profile) {
    const { data } = await supabase
      .from("wishlists")
      .select("store_id")
      .eq("shoppee_id", profile.id)
      .eq("store_id", params.id)
      .maybeSingle();
    wishlisted = !!data;
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`;

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
          <div className="flex items-center gap-1.5">
            <Phone
              size={14}
              strokeWidth={1.5}
              className="text-shoppee-textSecondary"
            />
            <a
              href={`tel:${store.contact_phone}`}
              className="text-meta text-shoppee-primary"
            >
              {store.contact_phone}
            </a>
          </div>
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

        {/* CTA buttons */}
        <div className="mt-4 flex gap-3">
          <a
            href={`tel:${store.contact_phone}`}
            className="flex-1 rounded-lg bg-shoppee-primary py-3 text-center text-button text-white"
          >
            Call store
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-shoppee-primary py-3 text-center text-button text-shoppee-primary"
          >
            Get directions
          </a>
        </div>
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
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="block"
              >
                <div className="overflow-hidden rounded-lg border border-shoppee-border bg-white shadow-sm">
                  {product.photo_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.photo_urls[0]}
                      alt={product.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full bg-shoppee-muted" />
                  )}
                  <div className="p-2">
                    <p className="line-clamp-1 font-serif text-h3 text-shoppee-textPrimary">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-meta text-shoppee-primary">
                      Rs. {product.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
