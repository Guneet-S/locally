import { redirect } from "next/navigation";
import { getCurrentProfile, createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("name, address, opening_time, closing_time, contact_phone, categories")
    .eq("owner_id", profile.id)
    .maybeSingle();

  async function signOut() {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/role");
  }

  return (
    <div className="flex min-h-screen flex-col px-4 pb-20 pt-12">
      <h1 className="text-h1 text-text-primary">Settings</h1>

      <div className="mt-6 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-4">
        <p className="text-meta text-text-tertiary">Account</p>
        <p className="mt-1 text-h3 text-text-primary">{profile.full_name}</p>
        <p className="mt-0.5 text-meta text-text-secondary">{profile.email}</p>
      </div>

      {store && (
        <div className="mt-4 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-meta text-text-tertiary">Store</p>
            <span
              className="text-meta text-text-tertiary"
              title="Coming soon"
            >
              Edit store
            </span>
          </div>
          <p className="mt-1 text-h3 text-text-primary">{store.name}</p>
          <p className="mt-0.5 text-meta text-text-secondary">{store.address}</p>
          {(store.opening_time || store.closing_time) && (
            <p className="mt-0.5 text-meta text-text-secondary">
              {store.opening_time ?? "—"} – {store.closing_time ?? "—"}
            </p>
          )}
          <p className="mt-0.5 text-meta text-text-secondary">
            {store.contact_phone}
          </p>
          {store.categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {store.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-shopper-light px-2 py-0.5 text-meta text-shopper-dark"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
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
