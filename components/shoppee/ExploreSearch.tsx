"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function ExploreSearch({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = inputRef.current?.value.trim() ?? "";
        router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
      }}
    >
      <div className="flex items-center gap-2 rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5">
        <Search size={16} strokeWidth={1.5} className="text-text-tertiary" />
        <input
          ref={inputRef}
          defaultValue={initialQ}
          placeholder="Search stores or styles..."
          className="flex-1 bg-transparent text-meta text-text-primary outline-none placeholder:text-text-tertiary"
          autoFocus
        />
      </div>
    </form>
  );
}
