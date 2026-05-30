import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import NewProductWizard, {
  type Gender,
  type Category,
  type ProductType,
} from "@/components/shopper/NewProductWizard";

function abbrev3(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!store) redirect("/setup");

  // Fetch taxonomy lookup tables — public-readable, used to drive the wizard.
  const [{ data: genders }, { data: categories }, { data: types }] =
    await Promise.all([
      supabase.from("genders").select("id, name").order("id"),
      supabase.from("product_categories").select("id, gender_id, name").order("id"),
      supabase.from("product_types").select("id, category_id, name").order("id"),
    ]);

  return (
    <NewProductWizard
      storeId={store.id}
      storeNameAbbrev={abbrev3(store.name)}
      ownerId={profile.id}
      genders={(genders ?? []) as Gender[]}
      categories={(categories ?? []) as Category[]}
      types={(types ?? []) as ProductType[]}
    />
  );
}
