import { redirect } from "next/navigation";
import { Playfair_Display, DM_Sans } from "next/font/google";
import SignupForm from "@/components/auth/SignupForm";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export default function SignupPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  if (searchParams.role !== "shoppee") redirect("/role");

  return (
    <div className={`${playfair.variable} ${dmSans.variable}`}>
      <SignupForm role="shoppee" />
    </div>
  );
}
