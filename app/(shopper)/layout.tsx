import { type ReactNode } from "react";
import ShopperBottomNav from "@/components/shopper/ShopperBottomNav";

export default function ShopperLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ShopperBottomNav />
    </>
  );
}
