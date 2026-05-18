"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, ShoppingBag } from "lucide-react";

export default function RolePage() {
  const [selected, setSelected] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    if (!selected) return;
    router.push("/onboarding/shoppee");
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pt-16 pb-8">
      <h1 className="text-center text-h1 text-text-primary">Who are you?</h1>

      <div className="mt-10 flex gap-4">
        <div className="flex flex-1 flex-col items-center gap-3 rounded-[10px] border border-border-subtle bg-surface p-5 text-center">
          <span className="text-text-tertiary">
            <Store size={32} strokeWidth={1.5} />
          </span>
          <span className="text-h3 text-text-secondary">Shopkeeper</span>
          <span className="text-meta text-text-tertiary">
            Accounts are by invitation only. Contact admin.
          </span>
        </div>
        <RoleCard
          icon={<ShoppingBag size={32} strokeWidth={1.5} />}
          title="Shoppee"
          subtitle="I want to find clothes near me"
          selected={selected}
          onSelect={() => setSelected(true)}
        />
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={[
            "w-full rounded-[10px] py-3 text-button text-white transition-colors",
            selected
              ? "bg-shoppee-primary"
              : "cursor-not-allowed bg-surface-dim",
          ].join(" ")}
        >
          {selected ? "Continue as Shoppee" : "Select a role to continue"}
        </button>
      </div>
    </div>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
}

function RoleCard({ icon, title, subtitle, selected, onSelect }: RoleCardProps) {
  const borderClass = selected
    ? "border-2 border-shoppee-primary"
    : "border border-border-subtle";
  const bgClass = selected ? "bg-shoppee-light" : "bg-surface";

  return (
    <button
      onClick={onSelect}
      className={`flex flex-1 flex-col items-center gap-3 rounded-[10px] p-5 text-center transition-colors ${borderClass} ${bgClass}`}
    >
      <span className="text-shoppee-primary">{icon}</span>
      <span className="text-h3 text-text-primary">{title}</span>
      <span className="text-meta text-text-secondary">{subtitle}</span>
    </button>
  );
}
