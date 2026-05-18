import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Link from "next/link";
import { Package } from "lucide-react";
import DeleteProductButton from "@/components/shopper/DeleteProductButton";

export default async function InventoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!store) redirect("/setup");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, sizes, photo_urls, is_available")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 pb-20 pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-text-primary">Inventory</h1>
        <Link
          href="/inventory/new"
          className="rounded-[10px] bg-shopper-primary px-4 py-2 text-button text-white"
        >
          Add +
        </Link>
      </div>

      {products && products.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {products.map((product) => (
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
              <div className="flex items-center gap-3">
                <Link
                  href={`/inventory/${product.id}/edit`}
                  className="text-meta text-shopper-primary"
                >
                  Edit
                </Link>
                <DeleteProductButton productId={product.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center text-center">
          <Package size={40} strokeWidth={1.5} className="text-surface-dim" />
          <p className="mt-3 text-h3 text-text-primary">No products yet</p>
          <p className="mt-1 text-body text-text-secondary">
            Start building your catalogue.
          </p>
          <Link
            href="/inventory/new"
            className="mt-6 rounded-[10px] bg-shopper-primary px-6 py-3 text-button text-white"
          >
            Add your first item
          </Link>
        </div>
      )}
    </div>
  );
}
