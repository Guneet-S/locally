import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import NewProductForm from "@/components/shopper/NewProductForm";

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!store) redirect("/setup");

  return <NewProductForm storeId={store.id} ownerId={profile.id} />;
}
