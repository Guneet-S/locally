"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Star, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/reviews", icon: Star, label: "Reviews" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function ShopperBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-border-subtle bg-surface">
      <div className="flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-3"
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                className={isActive ? "text-shopper-primary" : "text-text-tertiary"}
              />
              <span
                className={`text-meta ${isActive ? "text-shopper-primary" : "text-text-tertiary"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
