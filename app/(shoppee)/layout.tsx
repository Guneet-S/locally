import type { ReactNode } from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import ShoppeeBottomNav from "@/components/shoppee/ShoppeeBottomNav";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function ShoppeeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${playfair.variable} ${dmSans.variable} font-sans`}>
      {children}
      <ShoppeeBottomNav />
    </div>
  );
}
