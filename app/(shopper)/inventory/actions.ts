"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteProductAction(
  productId: string
): Promise<{ error: string } | undefined> {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/inventory");
}
