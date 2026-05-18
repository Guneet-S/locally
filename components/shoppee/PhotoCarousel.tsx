"use client";

import { useState, useRef } from "react";

interface PhotoCarouselProps {
  photos: string[];
  alt: string;
}

export default function PhotoCarousel({ photos, alt }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    setActiveIndex(Math.round(scrollLeft / clientWidth));
  };

  if (photos.length === 0) {
    return <div className="aspect-square w-full bg-surface-dim" />;
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`${alt} ${i + 1}`}
            className="aspect-square w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === activeIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
