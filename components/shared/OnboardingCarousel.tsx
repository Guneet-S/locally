"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export interface OnboardingSlide {
  Icon: LucideIcon;
  title: string;
  description: string;
}

interface OnboardingCarouselProps {
  role: "shopper" | "shoppee";
  slides: OnboardingSlide[];
}

export default function OnboardingCarousel({
  role,
  slides,
}: OnboardingCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const router = useRouter();

  const isLast = current === slides.length - 1;
  const primaryText =
    role === "shopper" ? "text-shopper-primary" : "text-shoppee-primary";
  const primaryBg =
    role === "shopper" ? "bg-shopper-primary" : "bg-shoppee-primary";
  const dotActive =
    role === "shopper" ? "bg-shopper-primary" : "bg-shoppee-primary";

  const handleNext = () => {
    if (isLast) {
      router.push(`/signup?role=${role}`);
    } else {
      setCurrent((prev) => prev + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < slides.length - 1) {
        setCurrent((prev) => prev + 1);
      } else if (diff < 0 && current > 0) {
        setCurrent((prev) => prev - 1);
      }
    }
  };

  const { Icon, title, description } = slides[current];

  return (
    <div
      className="flex min-h-screen flex-col px-4 pb-8 pt-12"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-end">
        <button
          onClick={() => router.push(`/login?role=${role}`)}
          className="text-body text-text-secondary"
        >
          Skip
        </button>
      </div>

      <div className={`mt-16 flex justify-center ${primaryText}`}>
        <Icon size={80} strokeWidth={1.5} />
      </div>

      <div className="mt-10 text-center">
        <h1 className="text-h1 text-text-primary">{title}</h1>
        <p className="mt-3 text-body text-text-secondary">{description}</p>
      </div>

      <div className="mt-10 flex justify-center gap-2">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === current ? `w-6 ${dotActive}` : "w-2 bg-surface-dim"
            }`}
          />
        ))}
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={handleNext}
          className={`w-full rounded-[10px] py-3 text-button text-white ${primaryBg}`}
        >
          {isLast ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}
