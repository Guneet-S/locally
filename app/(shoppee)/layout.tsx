import type { ReactNode } from "react";
import ShoppeeBottomNav from "@/components/shoppee/ShoppeeBottomNav";

export default function ShoppeeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ShoppeeBottomNav />
    </>
  );
}
