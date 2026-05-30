import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
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

type JunctionRow = {
  position: number;
  products: Product | null;
};

export default async function StoreCollectionPage({
  params,
}: {
  params: { id: string; slug: string };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, description, store_id")
    .eq("store_id", params.id)
    .eq("slug", params.slug)
    .maybeSingle();

  if (!collection) notFound();

  // Fetch products via junction, joined and ordered by position
  const { data: junctionRows } = await supabase
    .from("collection_products")
    .select(
      "position, products(id, name, price, photo_urls, fabric, gsm, product_types(name), genders(name), product_variants(qty))"
    )
    .eq("collection_id", collection.id)
    .order("position", { ascending: true })
    .returns<JunctionRow[]>();

  const products: Product[] = (junctionRows ?? [])
    .map((j) => j.products)
    .filter((p): p is Product => Boolean(p));

  // Wishlist hearts
  let productWishlistSet = new Set<string>();
  if (profile && products.length > 0) {
    const { data: wishRows } = await supabase
      .from("product_wishlist")
      .select("product_id")
      .eq("user_id", profile.id)
      .in(
        "product_id",
        products.map((p) => p.id)
      );
    productWishlistSet = new Set((wishRows ?? []).map((r) => r.product_id));
  }

  return (
    <div className="flex min-h-screen flex-col bg-shoppee-bg pb-20">
      <div className="px-4 pt-10">
        <Link
          href={`/store/${params.id}`}
          className="flex items-center gap-1 text-meta text-shoppee-primary"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to store
        </Link>
        <h1 className="mt-3 font-serif text-h1 text-shoppee-textPrimary">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-1 text-body text-shoppee-textSecondary">
            {collection.description}
          </p>
        )}
      </div>

      <div className="mt-5 px-4">
        {products.length === 0 ? (
          <p className="text-body text-shoppee-textSecondary">
            This collection is empty.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wishlisted={productWishlistSet.has(p.id)}
                userId={profile?.id ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
