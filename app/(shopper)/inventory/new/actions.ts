"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductFullInput, ProductVariantInput } from "@/lib/validations/store";

// ============================================================
// createProductAction — v2
// ============================================================
// Inserts a product + all variant rows. Photo URLs are already public
// Supabase Storage URLs uploaded client-side. RLS ensures the caller owns
// the store_id they're inserting under.

export async function createProductAction(
  data: Omit<ProductFullInput, "photo_urls" | "variants"> & {
    store_id: string;
    photo_urls: string[];
    variants: ProductVariantInput[];
  }
): Promise<{ error: string } | { product_id: string }> {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };

  const { variants, photo_urls, store_id, ...productFields } = data;

  // 1. Insert product
  const { data: inserted, error: productErr } = await supabase
    .from("products")
    .insert({
      store_id,
      name: productFields.name,
      description: productFields.description ?? null,
      price: productFields.price ?? 0,
      gender_id: productFields.gender_id,
      category_id: productFields.category_id,
      type_id: productFields.type_id,
      fabric: productFields.fabric ? productFields.fabric : null,
      gsm: productFields.gsm ?? null,
      fit: productFields.fit ? productFields.fit : null,
      pattern: productFields.pattern || null,
      sleeve_type: productFields.sleeve_type || null,
      neck_type: productFields.neck_type || null,
      occasion: productFields.occasion || null,
      season: productFields.season || null,
      wash_care: productFields.wash_care || null,
      photo_urls,
      status: productFields.status,
    })
    .select("id")
    .single();

  if (productErr || !inserted) {
    return { error: productErr?.message ?? "Failed to create product" };
  }

  // 2. Insert variants
  if (variants.length > 0) {
    const rows = variants.map((v) => ({
      product_id: inserted.id,
      color: v.color,
      size: v.size,
      qty: v.qty,
      sku: v.sku && v.sku.trim() ? v.sku.trim() : null,
    }));
    const { error: variantErr } = await supabase
      .from("product_variants")
      .insert(rows);
    if (variantErr) {
      // Roll back the product so we don't leave an orphan
      await supabase.from("products").delete().eq("id", inserted.id);
      return { error: `Variants failed: ${variantErr.message}` };
    }
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { product_id: inserted.id };
}
