"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleWishlistAction } from "@/app/(shoppee)/wishlist/actions";

interface WishlistButtonProps {
  storeId: string;
  initialWishlisted: boolean;
}

export default function WishlistButton({
  storeId,
  initialWishlisted,
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    setWishlisted((w) => !w);
    try {
      await toggleWishlistAction(storeId);
    } catch {
      setWishlisted((w) => !w);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/80"
    >
      <Heart
        size={16}
        strokeWidth={1.5}
        fill={wishlisted ? "currentColor" : "none"}
        className={wishlisted ? "text-danger" : "text-text-secondary"}
      />
    </button>
  );
}
