"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireStoreOwnership(): Promise<
  { error: string } | { storeId: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };
  const supabase = createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!store) return { error: "No store found" };
  return { storeId: store.id };
}

export async function createCollectionAction(input: {
  name: string;
  slug?: string;
  description?: string;
  cover_image_url?: string | null;
  product_ids: string[];
}): Promise<{ error: string } | { collection_id: string }> {
  const owned = await requireStoreOwnership();
  if ("error" in owned) return owned;

  const name = input.name.trim();
  if (!name) return { error: "Name is required" };
  const slug = input.slug?.trim() || slugify(name);
  if (!slug) return { error: "Slug is required" };

  const supabase = createClient();

  // Get max display_order to append at end
  const { data: existing } = await supabase
    .from("collections")
    .select("display_order")
    .eq("store_id", owned.storeId)
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { data: collection, error: insertErr } = await supabase
    .from("collections")
    .insert({
      store_id: owned.storeId,
      name,
      slug,
      description: input.description?.trim() || null,
      cover_image_url: input.cover_image_url || null,
      display_order: nextOrder,
    })
    .select("id")
    .single();

  if (insertErr || !collection) {
    return { error: insertErr?.message ?? "Failed to create collection" };
  }

  if (input.product_ids.length > 0) {
    const rows = input.product_ids.map((pid, idx) => ({
      collection_id: collection.id,
      product_id: pid,
      position: idx,
    }));
    const { error: junctionErr } = await supabase
      .from("collection_products")
      .insert(rows);
    if (junctionErr) {
      return { error: junctionErr.message };
    }
  }

  revalidatePath("/collections");
  return { collection_id: collection.id };
}

export async function updateCollectionAction(input: {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  cover_image_url?: string | null;
}): Promise<{ error: string } | { ok: true }> {
  const owned = await requireStoreOwnership();
  if ("error" in owned) return owned;

  const name = input.name.trim();
  if (!name) return { error: "Name is required" };
  const slug = input.slug?.trim() || slugify(name);
  if (!slug) return { error: "Slug is required" };

  const supabase = createClient();
  const { error } = await supabase
    .from("collections")
    .update({
      name,
      slug,
      description: input.description?.trim() || null,
      cover_image_url: input.cover_image_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("store_id", owned.storeId);

  if (error) return { error: error.message };
  revalidatePath("/collections");
  revalidatePath(`/collections/${input.id}`);
  return { ok: true };
}

export async function deleteCollectionAction(
  collectionId: string
): Promise<{ error: string } | { ok: true }> {
  const owned = await requireStoreOwnership();
  if ("error" in owned) return owned;

  const supabase = createClient();
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("store_id", owned.storeId);

  if (error) return { error: error.message };
  revalidatePath("/collections");
  redirect("/collections");
}

export async function addProductsAction(input: {
  collection_id: string;
  product_ids: string[];
}): Promise<{ error: string } | { ok: true }> {
  const owned = await requireStoreOwnership();
  if ("error" in owned) return owned;
  if (input.product_ids.length === 0) return { ok: true };

  const supabase = createClient();

  // Verify the collection belongs to this store
  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", input.collection_id)
    .eq("store_id", owned.storeId)
    .maybeSingle();
  if (!collection) return { error: "Collection not found" };

  // Get max position
  const { data: existing } = await supabase
    .from("collection_products")
    .select("position")
    .eq("collection_id", input.collection_id)
    .order("position", { ascending: false })
    .limit(1);
  let nextPos = (existing?.[0]?.position ?? -1) + 1;

  const rows = input.product_ids.map((pid) => ({
    collection_id: input.collection_id,
    product_id: pid,
    position: nextPos++,
  }));

  const { error } = await supabase.from("collection_products").insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/collections/${input.collection_id}`);
  return { ok: true };
}

export async function removeProductAction(input: {
  collection_id: string;
  product_id: string;
}): Promise<{ error: string } | { ok: true }> {
  const owned = await requireStoreOwnership();
  if ("error" in owned) return owned;

  const supabase = createClient();

  // Verify ownership via collection->store
  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", input.collection_id)
    .eq("store_id", owned.storeId)
    .maybeSingle();
  if (!collection) return { error: "Collection not found" };

  const { error } = await supabase
    .from("collection_products")
    .delete()
    .eq("collection_id", input.collection_id)
    .eq("product_id", input.product_id);

  if (error) return { error: error.message };
  revalidatePath(`/collections/${input.collection_id}`);
  return { ok: true };
}

export async function reorderProductAction(input: {
  collection_id: string;
  product_id: string;
  direction: "up" | "down";
}): Promise<{ error: string } | { ok: true }> {
  const owned = await requireStoreOwnership();
  if ("error" in owned) return owned;

  const supabase = createClient();

  // Verify ownership
  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", input.collection_id)
    .eq("store_id", owned.storeId)
    .maybeSingle();
  if (!collection) return { error: "Collection not found" };

  // Load all rows ordered by position
  const { data: rows } = await supabase
    .from("collection_products")
    .select("id, product_id, position")
    .eq("collection_id", input.collection_id)
    .order("position", { ascending: true });

  if (!rows || rows.length === 0) return { error: "No products" };

  const idx = rows.findIndex((r) => r.product_id === input.product_id);
  if (idx === -1) return { error: "Product not in collection" };

  const swapWith = input.direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) return { ok: true };

  const a = rows[idx];
  const b = rows[swapWith];

  // Swap positions
  const { error: e1 } = await supabase
    .from("collection_products")
    .update({ position: b.position })
    .eq("id", a.id);
  if (e1) return { error: e1.message };
  const { error: e2 } = await supabase
    .from("collection_products")
    .update({ position: a.position })
    .eq("id", b.id);
  if (e2) return { error: e2.message };

  revalidatePath(`/collections/${input.collection_id}`);
  return { ok: true };
}
