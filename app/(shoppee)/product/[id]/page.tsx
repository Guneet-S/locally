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
    <div className="flex min-h-screen flex-col pb-20">
      <PhotoCarousel
        photos={product.photo_urls as string[]}
        alt={product.name}
      />

      <div className="px-4 pt-4">
        <span className="rounded-full bg-shoppee-light px-2.5 py-1 text-meta text-shoppee-dark">
          {product.category}
        </span>
        <h1 className="mt-2 text-h1 text-text-primary">{product.name}</h1>
        <p className="mt-1 text-h2 text-shoppee-primary">
          Rs. {(product.price as number).toLocaleString("en-IN")}
        </p>

        {/* Sizes */}
        {(product.sizes as string[]).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-meta text-text-secondary">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {(product.sizes as string[]).map((size) => (
                <span
                  key={size}
                  className="rounded-[6px] border-[0.5px] border-border-subtle px-3 py-1 text-meta text-text-secondary"
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
            <p className="mb-2 text-meta text-text-secondary">Colors</p>
            <div className="flex flex-wrap gap-2">
              {(product.colors as string[]).map((color) => (
                <span
                  key={color}
                  className="h-7 w-7 rounded-full border border-border-subtle"
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
        <div className="mx-4 mt-6 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-3">
          <p className="text-meta text-text-tertiary">Sold by</p>
          <p className="mt-1 text-h3 text-text-primary">{store.name}</p>
          <div className="mt-0.5 flex items-center gap-1">
            <MapPin
              size={11}
              strokeWidth={1.5}
              className="shrink-0 text-text-tertiary"
            />
            <p className="line-clamp-1 text-meta text-text-secondary">
              {store.address}
            </p>
          </div>
          <Link
            href={`/store/${store.id}`}
            className="mt-3 block w-full rounded-[10px] bg-shoppee-primary py-3 text-center text-button text-white"
          >
            Visit store
          </Link>
        </div>
      )}
    </div>
  );
}
