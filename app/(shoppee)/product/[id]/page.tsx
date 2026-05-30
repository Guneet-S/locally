import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";
import PhotoCarousel from "@/components/shoppee/PhotoCarousel";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_urls: string[];
  store_id: string;
  product_types: { name: string } | null;
  product_variants: { color: string; size: string; qty: number }[];
};

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price, photo_urls, store_id, product_types(name), product_variants(color, size, qty)"
    )
    .eq("id", params.id)
    .maybeSingle<ProductRow>();

  if (!product) notFound();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, address")
    .eq("id", product.store_id)
    .maybeSingle();

  // Derive unique sizes/colors from variants (only show in-stock ones)
  const inStock = product.product_variants.filter((v) => v.qty > 0);
  const sizes = Array.from(new Set(inStock.map((v) => v.size)));
  const colors = Array.from(new Set(inStock.map((v) => v.color)));
  const typeLabel = product.product_types?.name ?? "Apparel";

  return (
    <div className="flex min-h-screen flex-col bg-shoppee-bg pb-20">
      <PhotoCarousel photos={product.photo_urls} alt={product.name} />

      <div className="px-4 pt-4">
        <span className="rounded-full bg-shoppee-muted px-2.5 py-1 text-meta text-shoppee-primary">
          {typeLabel}
        </span>
        <h1 className="mt-2 font-serif text-h1 text-shoppee-textPrimary">
          {product.name}
        </h1>
        <p className="mt-1 text-h2 text-shoppee-primary">
          Rs. {product.price.toLocaleString("en-IN")}
        </p>

        {product.description && (
          <p className="mt-3 text-body text-shoppee-textSecondary">
            {product.description}
          </p>
        )}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-meta text-shoppee-textSecondary">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <span
                  key={size}
                  className="rounded-lg border border-shoppee-border px-3 py-1 text-meta text-shoppee-textSecondary"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        {colors.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-meta text-shoppee-textSecondary">Colors</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <span
                  key={color}
                  className="rounded-lg border border-shoppee-border px-3 py-1 text-meta text-shoppee-textSecondary"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Store card */}
      {store && (
        <div className="mx-4 mt-6 rounded-lg border border-shoppee-border bg-white p-3 shadow-sm">
          <p className="text-meta text-shoppee-textSecondary">Sold by</p>
          <p className="mt-1 font-serif text-h3 text-shoppee-textPrimary">
            {store.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <MapPin
              size={11}
              strokeWidth={1.5}
              className="shrink-0 text-shoppee-textSecondary"
            />
            <p className="line-clamp-1 text-meta text-shoppee-textSecondary">
              {store.address}
            </p>
          </div>
          <Link
            href={`/store/${store.id}`}
            className="mt-3 block w-full rounded-lg bg-shoppee-primary py-3 text-center text-button text-white"
          >
            Visit store
          </Link>
        </div>
      )}
    </div>
  );
}
