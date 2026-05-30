"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Props {
  defaultValue: string;
  tab: "products" | "stores";
}

export default function SearchInput({ defaultValue, tab }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = inputRef.current?.value.trim() ?? "";
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        params.set("tab", tab);
        router.push(`/search?${params.toString()}`);
      }}
    >
      <div className="flex items-center gap-2 rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5">
        <Search size={16} strokeWidth={1.5} className="text-text-tertiary" />
        <input
          ref={inputRef}
          name="q"
          defaultValue={defaultValue}
          placeholder="Search products or stores..."
          className="flex-1 bg-transparent text-meta text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>
    </form>
  );
}
