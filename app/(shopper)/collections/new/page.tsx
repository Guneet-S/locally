import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import CollectionForm, {
  type ProductOption,
} from "@/components/shopper/CollectionForm";

export default async function NewCollectionPage() {
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
    .select("id, name, photo_urls, price")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<ProductOption[]>();

  return (
    <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24 pt-10">
      <Link
        href="/collections"
        className="flex items-center gap-1 text-meta text-shopper-primary"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Back
      </Link>
      <h1 className="mt-3 text-h1 text-text-primary">New collection</h1>
      <p className="mt-1 text-meta text-text-secondary">
        Group products into a themed set.
      </p>
      <div className="mt-5">
        <CollectionForm
          mode="create"
          ownerId={profile.id}
          storeId={store.id}
          products={products ?? []}
        />
      </div>
    </div>
  );
}
