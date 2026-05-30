import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import CollectionForm from "@/components/shopper/CollectionForm";
import CollectionProductManager from "@/components/shopper/CollectionProductManager";

type ProductLite = {
  id: string;
  name: string;
  photo_urls: string[];
  price: number | null;
};

export default async function EditCollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!store) redirect("/setup");

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, slug, description, cover_image_url, store_id")
    .eq("id", params.id)
    .eq("store_id", store.id)
    .maybeSingle();

  if (!collection) notFound();

  // Products in this collection, ordered by position
  const { data: junctionRows } = await supabase
    .from("collection_products")
    .select("product_id, position")
    .eq("collection_id", collection.id)
    .order("position", { ascending: true });

  const orderedIds = (junctionRows ?? []).map((r) => r.product_id);

  // All this store's active products
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, photo_urls, price")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<ProductLite[]>();

  const allList = allProducts ?? [];
  const allById = new Map<string, ProductLite>(allList.map((p) => [p.id, p]));

  const inCollection: ProductLite[] = orderedIds
    .map((id) => allById.get(id))
    .filter((p): p is ProductLite => Boolean(p));

  const inSet = new Set(orderedIds);
  const available = allList.filter((p) => !inSet.has(p.id));

  return (
    <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24 pt-10">
      <Link
        href="/collections"
        className="flex items-center gap-1 text-meta text-shopper-primary"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Back to collections
      </Link>
      <h1 className="mt-3 text-h1 text-text-primary">{collection.name}</h1>
      <p className="mt-1 text-meta text-text-secondary">
        Edit details and manage products.
      </p>

      <div className="mt-5">
        <CollectionForm
          mode="edit"
          ownerId={profile.id}
          storeId={store.id}
          initial={{
            id: collection.id,
            name: collection.name,
            slug: collection.slug,
            description: collection.description,
            cover_image_url: collection.cover_image_url,
          }}
          products={[]}
        />
      </div>

      <div className="mt-8">
        <CollectionProductManager
          collectionId={collection.id}
          collectionName={collection.name}
          inCollection={inCollection}
          available={available}
        />
      </div>
    </div>
  );
}
