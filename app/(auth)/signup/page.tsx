import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role =
    searchParams.role === "shopper" || searchParams.role === "shoppee"
      ? searchParams.role
      : null;

  if (!role) redirect("/role");

  return <SignupForm role={role} />;
}
