"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, ShoppingBag } from "lucide-react";

type Role = "shopper" | "shoppee";

export default function RolePage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/onboarding/${selected}`);
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pt-16 pb-8">
      <h1 className="text-center text-h1 text-text-primary">Who are you?</h1>

      <div className="mt-10 flex gap-4">
        <RoleCard
          icon={<Store size={32} strokeWidth={1.5} />}
          title="Shopper"
          subtitle="I own or manage a clothing store"
          role="shopper"
          selected={selected === "shopper"}
          onSelect={() => setSelected("shopper")}
        />
        <RoleCard
          icon={<ShoppingBag size={32} strokeWidth={1.5} />}
          title="Shoppee"
          subtitle="I want to find clothes near me"
          role="shoppee"
          selected={selected === "shoppee"}
          onSelect={() => setSelected("shoppee")}
        />
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={[
            "w-full rounded-[10px] py-3 text-button text-white transition-colors",
            selected === "shopper"
              ? "bg-shopper-primary"
              : selected === "shoppee"
                ? "bg-shoppee-primary"
                : "cursor-not-allowed bg-surface-dim",
          ].join(" ")}
        >
          {selected
            ? `Continue as ${selected === "shopper" ? "Shopper" : "Shoppee"}`
            : "Select a role to continue"}
        </button>
      </div>
    </div>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  role: Role;
  selected: boolean;
  onSelect: () => void;
}

function RoleCard({ icon, title, subtitle, role, selected, onSelect }: RoleCardProps) {
  const borderClass = selected
    ? role === "shopper"
      ? "border-2 border-shopper-primary"
      : "border-2 border-shoppee-primary"
    : "border border-border-subtle";

  const bgClass = selected
    ? role === "shopper"
      ? "bg-shopper-light"
      : "bg-shoppee-light"
    : "bg-surface";

  const iconClass =
    role === "shopper" ? "text-shopper-primary" : "text-shoppee-primary";

  return (
    <button
      onClick={onSelect}
      className={`flex flex-1 flex-col items-center gap-3 rounded-[10px] p-5 text-center transition-colors ${borderClass} ${bgClass}`}
    >
      <span className={iconClass}>{icon}</span>
      <span className="text-h3 text-text-primary">{title}</span>
      <span className="text-meta text-text-secondary">{subtitle}</span>
    </button>
  );
}
