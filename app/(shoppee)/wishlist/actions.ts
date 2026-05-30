"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
