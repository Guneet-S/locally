"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SizeLabel = Database["public"]["Enums"]["size_label"];
type ProductCategory = Database["public"]["Enums"]["product_category"];

export async function createProductAction(data: {
  name: string;
  price: number;
  category: ProductCategory;
  sizes: string[];
  colors: string[];
  photo_urls: string[];
  store_id: string;
}): Promise<{ error: string } | undefined> {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };

  const { error } = await supabase.from("products").insert({
    store_id: data.store_id,
    name: data.name,
    price: data.price,
    category: data.category,
    sizes: data.sizes as SizeLabel[],
    colors: data.colors,
    photo_urls: data.photo_urls,
    is_available: true,
  });

  if (error) return { error: error.message };
}
