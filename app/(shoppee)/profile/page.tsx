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

  return (
    <div className="flex min-h-screen flex-col px-4 pb-24 pt-12">
      <h1 className="text-h1 text-text-primary">Profile</h1>

      <div className="mt-6 rounded-[10px] border border-border-subtle bg-surface p-4">
        <p className="text-h3 text-text-primary">{profile.full_name}</p>
        <p className="mt-1 text-meta text-text-secondary">{profile.email}</p>
        <p className="mt-1 text-meta text-text-tertiary">
          Member since{" "}
          {new Date(profile.created_at).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

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
