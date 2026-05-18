import { redirect } from "next/navigation";
import { getCurrentProfile, createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shoppee");

  async function signOut() {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/role");
  }

  const initial = profile.full_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex min-h-screen flex-col bg-shoppee-bg px-4 pb-24 pt-12">
      <h1 className="font-serif text-h1 text-shoppee-textPrimary">Profile</h1>

      <div className="mt-6 rounded-lg border border-shoppee-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-shoppee-muted">
            <span className="font-serif text-h2 text-shoppee-primary">
              {initial}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-xl text-shoppee-textPrimary">
              {profile.full_name}
            </p>
            <p className="mt-0.5 text-meta text-shoppee-textSecondary">
              {profile.email}
            </p>
            <p className="mt-0.5 text-meta text-shoppee-textSecondary">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg border border-shoppee-primary py-3 text-button text-shoppee-primary"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
