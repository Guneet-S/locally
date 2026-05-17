"use client";

import OnboardingCarousel, {
  type OnboardingSlide,
} from "@/components/shared/OnboardingCarousel";
import { Store, Shirt, MapPin } from "lucide-react";

const slides: OnboardingSlide[] = [
  {
    Icon: Store,
    title: "Discover local stores",
    description: "Find boutiques and clothing shops near you",
  },
  {
    Icon: Shirt,
    title: "Browse full catalogues",
    description: "Explore items with sizes, colours, and prices",
  },
  {
    Icon: MapPin,
    title: "Walk in & shop",
    description: "Get address, hours, directions — buy in person",
  },
];

export default function ShoppeeOnboardingPage() {
  return <OnboardingCarousel role="shoppee" slides={slides} />;
}
