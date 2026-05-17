import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function RootPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/role");

  if (profile.role === "shopper") redirect("/dashboard");
  redirect("/home");
}
