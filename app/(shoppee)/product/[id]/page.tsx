import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";
import PhotoCarousel from "@/components/shoppee/PhotoCarousel";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) notFound();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, address")
    .eq("id", product.store_id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-shoppee-bg pb-20">
      <PhotoCarousel
        photos={product.photo_urls as string[]}
        alt={product.name}
      />

      <div className="px-4 pt-4">
        <span className="rounded-full bg-shoppee-muted px-2.5 py-1 text-meta text-shoppee-primary">
          {product.category}
        </span>
        <h1 className="mt-2 font-serif text-h1 text-shoppee-textPrimary">
          {product.name}
        </h1>
        <p className="mt-1 text-h2 text-shoppee-primary">
          Rs. {(product.price as number).toLocaleString("en-IN")}
        </p>

        {/* Sizes */}
        {(product.sizes as string[]).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-meta text-shoppee-textSecondary">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {(product.sizes as string[]).map((size) => (
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
        {(product.colors as string[]).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-meta text-shoppee-textSecondary">Colors</p>
            <div className="flex flex-wrap gap-2">
              {(product.colors as string[]).map((color) => (
                <span
                  key={color}
                  className="h-7 w-7 rounded-full border border-shoppee-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
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
