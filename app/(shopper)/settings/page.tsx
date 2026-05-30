import { redirect } from "next/navigation";
import { getCurrentProfile, createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/shopper/SettingsForm";
import type { BusinessHoursDay } from "@/lib/validations/store";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select(
      "id, name, address, description, contact_phone, whatsapp_number, categories, logo_url, cover_image_url, business_hours, completeness_score"
    )
    .eq("owner_id", profile.id)
    .maybeSingle();

  async function signOut() {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/role");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col px-4 pb-24 pt-12">
      <h1 className="text-h1 text-text-primary">Settings</h1>

      <div className="mt-6 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-4">
        <p className="text-meta text-text-tertiary">Account</p>
        <p className="mt-1 text-h3 text-text-primary">{profile.full_name}</p>
        <p className="mt-0.5 text-meta text-text-secondary">{profile.email}</p>
      </div>

      {store ? (
        <SettingsForm
          initial={{
            id: store.id,
            name: store.name,
            address: store.address,
            description: store.description,
            contact_phone: store.contact_phone,
            whatsapp_number: store.whatsapp_number,
            categories: store.categories,
            logo_url: store.logo_url,
            cover_image_url: store.cover_image_url,
            business_hours: (store.business_hours as BusinessHoursDay[] | null) ?? null,
            completeness_score: store.completeness_score,
          }}
        />
      ) : (
        <p className="mt-6 text-body text-text-secondary">
          No store set up yet. Visit /setup to create one.
        </p>
      )}

      <div className="mt-auto pt-8">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-[10px] border border-danger py-3 text-button text-danger"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
