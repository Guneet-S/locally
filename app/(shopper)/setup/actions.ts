"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createStoreAction(data: {
  name: string;
  address: string;
  opening_time?: string;
  closing_time?: string;
  contact_phone: string;
  categories: string[];
  banner_url?: string;
  lat: number;
  lng: number;
}): Promise<{ error: string } | undefined> {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };

  const { error } = await supabase.from("stores").insert({
    owner_id: profile.id,
    name: data.name,
    address: data.address,
    opening_time: data.opening_time ?? null,
    closing_time: data.closing_time ?? null,
    contact_phone: data.contact_phone,
    categories: data.categories,
    banner_url: data.banner_url ?? null,
    location: `POINT(${data.lng} ${data.lat})`,
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
