"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function logContactEvent(
  storeId: string,
  eventType: "whatsapp" | "call" | "directions"
) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  await supabase.from("contact_events").insert({
    store_id: storeId,
    event_type: eventType,
    user_id: profile?.id ?? null,
  });
}
