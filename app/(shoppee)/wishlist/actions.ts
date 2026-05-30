"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function toggleWishlistAction(storeId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?role=shoppee");

  const { data: existing } = await supabase
    .from("store_wishlists")
    .select("store_id")
    .eq("shoppee_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("store_wishlists")
      .delete()
      .eq("shoppee_id", user.id)
      .eq("store_id", storeId);
  } else {
    await supabase
      .from("store_wishlists")
      .insert({ shoppee_id: user.id, store_id: storeId });
  }

  revalidatePath("/wishlist");
}

export async function toggleProductWishlist(productId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?role=shoppee");

  const { data: existing } = await supabase
    .from("product_wishlist")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("product_wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
  } else {
    await supabase
      .from("product_wishlist")
      .insert({ user_id: user.id, product_id: productId });
  }

  revalidatePath("/wishlist");
}

export async function toggleStoreWishlist(storeId: string): Promise<void> {
  return toggleWishlistAction(storeId);
}
