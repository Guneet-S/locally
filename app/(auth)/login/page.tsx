import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role =
    searchParams.role === "shopper" || searchParams.role === "shoppee"
      ? searchParams.role
      : null;

  if (!role) redirect("/role");

  return <LoginForm role={role} />;
}
