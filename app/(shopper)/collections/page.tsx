import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { Plus, FolderPlus } from "lucide-react";

type CollectionRow = {
  id: string;
  name: string;
  cover_image_url: string | null;
  display_order: number;
  collection_products: { count: number }[];
};

export default async function CollectionsListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!store) redirect("/setup");

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, cover_image_url, display_order, collection_products(count)")
    .eq("store_id", store.id)
    .order("display_order", { ascending: true })
    .returns<CollectionRow[]>();

  const list = collections ?? [];

  return (
    <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24 pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-text-primary">Collections</h1>
        <Link
          href="/collections/new"
          className="flex items-center gap-1 rounded-[10px] bg-shopper-primary px-3 py-2 text-meta text-white"
        >
          <Plus size={14} strokeWidth={1.5} />
          New collection
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <FolderPlus
            size={40}
            strokeWidth={1.5}
            className="text-text-tertiary"
          />
          <p className="mt-3 text-h3 text-text-primary">
            You have no collections yet
          </p>
          <p className="mt-1 text-body text-text-secondary">
            Create one to group your products.
          </p>
          <Link
            href="/collections/new"
            className="mt-5 inline-block rounded-[10px] bg-shopper-primary px-4 py-2 text-button text-white"
          >
            Create collection
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {list.map((c) => {
            const count = c.collection_products?.[0]?.count ?? 0;
            return (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className="flex flex-col overflow-hidden rounded-[10px] border border-border-subtle bg-surface"
              >
                {c.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.cover_image_url}
                    alt={c.name}
                    className="h-[120px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[120px] w-full items-center justify-center bg-shopper-light">
                    <FolderPlus
                      size={28}
                      strokeWidth={1.5}
                      className="text-shopper-primary"
                    />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="line-clamp-1 text-body text-text-primary">
                    {c.name}
                  </p>
                  <p className="mt-1 text-meta text-text-secondary">
                    {count} {count === 1 ? "product" : "products"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
