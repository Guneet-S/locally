"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleProductWishlist } from "@/app/(shoppee)/wishlist/actions";

interface ProductWishlistHeartProps {
  productId: string;
  initialWishlisted: boolean;
}

export default function ProductWishlistHeart({
  productId,
  initialWishlisted,
}: ProductWishlistHeartProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    setWishlisted((w) => !w);
    try {
      await toggleProductWishlist(productId);
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
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm"
    >
      <Heart
        size={14}
        strokeWidth={1.5}
        fill={wishlisted ? "currentColor" : "none"}
        className="text-shoppee-primary"
      />
    </button>
  );
}
