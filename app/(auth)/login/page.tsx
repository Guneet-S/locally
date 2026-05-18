import { redirect } from "next/navigation";
import { Playfair_Display, DM_Sans } from "next/font/google";
import LoginForm from "@/components/auth/LoginForm";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

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

  return (
    <div className={`${playfair.variable} ${dmSans.variable}`}>
      <LoginForm role={role} />
    </div>
  );
}
