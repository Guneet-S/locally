"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  storeName: string;
  storeUrl: string;
}

export default function DashboardShareButton({ storeName, storeUrl }: Props) {
  const handleShare = async () => {
    const fullUrl =
      typeof window !== "undefined" ? `${window.location.origin}${storeUrl}` : storeUrl;

    // Try Web Share API first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Check out ${storeName} on Locally`,
          url: fullUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed; fall through to clipboard
        if ((err as { name?: string })?.name === "AbortError") return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Store link copied");
    } catch {
      toast.error("Could not share link");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center gap-2 rounded-[10px] border border-shopper-primary py-3 text-button text-shopper-primary"
    >
      <Share2 size={16} strokeWidth={1.5} />
      Share store
    </button>
  );
}
