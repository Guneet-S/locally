"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function HomeSearch() {
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = (
          e.currentTarget.elements.namedItem("q") as HTMLInputElement
        ).value.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
    >
      <div className="flex items-center gap-2 rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5">
        <Search size={16} strokeWidth={1.5} className="text-text-tertiary" />
        <input
          name="q"
          placeholder="Search products or stores..."
          className="flex-1 bg-transparent text-meta text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>
    </form>
  );
}
