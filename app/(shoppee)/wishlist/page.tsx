import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import WishlistTabs from "@/components/shoppee/WishlistTabs";

type WishlistedStore = {
  id: string;
  name: string;
  cover_image_url: string | null;
  banner_url: string | null;
  categories: string[];
};

type WishlistedProduct = {
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

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shoppee");

  const supabase = createClient();

  // Fetch store wishlist
  const { data: storeWishlistRows } = await supabase
    .from("store_wishlists")
    .select("store_id")
    .eq("shoppee_id", profile.id)
    .order("created_at", { ascending: false });

  const storeIds = storeWishlistRows?.map((w) => w.store_id) ?? [];

  const stores: WishlistedStore[] = [];
  if (storeIds.length > 0) {
    const { data } = await supabase
      .from("stores")
      .select("id, name, cover_image_url, banner_url, categories")
      .in("id", storeIds)
      .returns<WishlistedStore[]>();
    if (data) {
      const storeMap = new Map(data.map((s) => [s.id, s]));
      for (const id of storeIds) {
        const store = storeMap.get(id);
        if (store) stores.push(store);
      }
    }
  }

  // Fetch product wishlist
  const { data: productWishlistRows } = await supabase
    .from("product_wishlist")
    .select("product_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const productIds = productWishlistRows?.map((w) => w.product_id) ?? [];

  const products: WishlistedProduct[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, price, photo_urls, fabric, gsm, product_types(name), genders(name), product_variants(qty)"
      )
      .in("id", productIds)
      .returns<WishlistedProduct[]>();
    if (data) {
      const productMap = new Map(data.map((p) => [p.id, p]));
      for (const id of productIds) {
        const product = productMap.get(id);
        if (product) products.push(product);
      }
    }
  }

  return (
    <div className="min-h-screen bg-shoppee-bg px-4 pb-20 pt-12">
      <h1 className="font-serif text-h1 text-shoppee-textPrimary">Wishlist</h1>
      <WishlistTabs
        storeCount={stores.length}
        productCount={products.length}
        stores={stores}
        products={products}
        userId={profile.id}
        defaultTab={searchParams.tab}
      />
    </div>
  );
}
