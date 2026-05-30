"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Bookmark,
  Clock,
  MapPin,
  Bell,
  Share2,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changeCityAction } from "@/app/(shoppee)/profile/actions";

interface ProfileMoreSectionProps {
  savedProductsCount: number;
  savedStoresCount: number;
}

const CITIES = ["Patiala", "Chandigarh", "Ludhiana", "Amritsar"];

function RowItem({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-shoppee-border bg-white p-3 shadow-sm active:bg-shoppee-muted transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-shoppee-primary">{icon}</span>
        <span className="text-sm font-medium text-shoppee-textPrimary">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <span className="bg-shoppee-muted text-shoppee-primary rounded-full px-2 text-meta">
            {badge}
          </span>
        )}
        <ChevronRight size={16} className="text-shoppee-textSecondary" />
      </div>
    </button>
  );
}

export default function ProfileMoreSection({
  savedProductsCount,
  savedStoresCount,
}: ProfileMoreSectionProps) {
  const router = useRouter();
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [changingCity, setChangingCity] = useState(false);

  const handleCitySelect = async (city: string | "auto") => {
    setChangingCity(true);
    try {
      await changeCityAction(city);
      setCityModalOpen(false);
      router.push("/home");
    } catch {
      // ignore
    } finally {
      setChangingCity(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Locally",
          text: "Discover local clothing stores near you",
          url: window.location.origin,
        })
        .catch(() => null);
    } else {
      navigator.clipboard
        .writeText(window.location.origin)
        .catch(() => null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <RowItem
          icon={<Heart size={18} strokeWidth={1.5} />}
          label="Saved Products"
          badge={savedProductsCount}
          onClick={() => router.push("/wishlist?tab=products")}
        />
        <RowItem
          icon={<Bookmark size={18} strokeWidth={1.5} />}
          label="Saved Stores"
          badge={savedStoresCount}
          onClick={() => router.push("/wishlist?tab=stores")}
        />
        <RowItem
          icon={<Clock size={18} strokeWidth={1.5} />}
          label="Recently Viewed Stores"
          onClick={() => router.push("/wishlist?tab=stores")}
        />
        <RowItem
          icon={<MapPin size={18} strokeWidth={1.5} />}
          label="Change City"
          onClick={() => setCityModalOpen(true)}
        />
        <RowItem
          icon={<Bell size={18} strokeWidth={1.5} />}
          label="Notification Preferences"
          onClick={() => router.push("/profile/notifications")}
        />
        <RowItem
          icon={<Share2 size={18} strokeWidth={1.5} />}
          label="Share App"
          onClick={handleShare}
        />
      </div>

      <Dialog open={cityModalOpen} onOpenChange={setCityModalOpen}>
        <DialogContent className="max-w-xs rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-shoppee-textPrimary">
              Change City
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                disabled={changingCity}
                className="rounded-[10px] border border-shoppee-border bg-white p-3 text-left text-sm font-medium text-shoppee-textPrimary active:bg-shoppee-muted transition-colors disabled:opacity-50"
              >
                {city}
              </button>
            ))}
            <button
              onClick={() => handleCitySelect("auto")}
              disabled={changingCity}
              className="mt-1 rounded-[10px] border border-shoppee-primary bg-transparent p-3 text-left text-sm font-medium text-shoppee-primary active:bg-shoppee-primary active:text-white transition-colors disabled:opacity-50"
            >
              Auto-detect location
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
