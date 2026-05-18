"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/explore", icon: Search, label: "Explore" },
  { href: "/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function ShoppeeBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t border-border-subtle bg-surface pb-4">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 pt-3 text-meta ${
              active ? "text-shoppee-primary" : "text-text-tertiary"
            }`}
          >
            <Icon size={20} strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
