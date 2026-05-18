import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  if (searchParams.role !== "shoppee") redirect("/role");

  return <SignupForm role="shoppee" />;
}
