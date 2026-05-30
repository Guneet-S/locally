"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { StoreInput } from "@/lib/validations/store";

export async function createStoreAction(
  data: StoreInput & {
    logo_url?: string;
    cover_image_url?: string;
  }
): Promise<{ error: string } | undefined> {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };

  const { error } = await supabase.from("stores").insert({
    owner_id: profile.id,
    name: data.name,
    address: data.address,
    description: data.description ?? null,
    opening_time: data.opening_time ?? null,
    closing_time: data.closing_time ?? null,
    contact_phone: data.contact_phone,
    whatsapp_number: data.whatsapp_number ?? null,
    categories: data.categories,
    business_hours: data.business_hours ?? [],
    logo_url: data.logo_url ?? null,
    cover_image_url: data.cover_image_url ?? null,
    // Geometry typing in @supabase/postgrest-js is `unknown` for the
    // PostGIS `location` column — Postgres parses this WKT cast on insert.
    location: `POINT(${data.lng} ${data.lat})` as unknown as never,
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

// Patch existing store with new editable fields (used by /settings)
export async function updateStoreAction(
  data: Partial<StoreInput> & {
    logo_url?: string;
    cover_image_url?: string;
  }
): Promise<{ error: string } | { ok: true }> {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };

  // Build the patch with concrete typing so Supabase narrows it.
  const update: {
    name?: string;
    address?: string;
    description?: string | null;
    contact_phone?: string;
    whatsapp_number?: string | null;
    categories?: string[];
    business_hours?: unknown;
    logo_url?: string | null;
    cover_image_url?: string | null;
  } = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.address !== undefined) update.address = data.address;
  if (data.description !== undefined) update.description = data.description;
  if (data.contact_phone !== undefined) update.contact_phone = data.contact_phone;
  if (data.whatsapp_number !== undefined)
    update.whatsapp_number = data.whatsapp_number;
  if (data.categories !== undefined) update.categories = data.categories;
  if (data.business_hours !== undefined)
    update.business_hours = data.business_hours;
  if (data.logo_url !== undefined) update.logo_url = data.logo_url;
  if (data.cover_image_url !== undefined)
    update.cover_image_url = data.cover_image_url;

  const { error } = await supabase
    .from("stores")
    // `business_hours` is `Json | null | undefined` in the generated types; our
    // typed shape above is structurally compatible.
    .update(update as never)
    .eq("owner_id", profile.id);

  if (error) return { error: error.message };
  return { ok: true };
}
