"use client";

import OnboardingCarousel, {
  type OnboardingSlide,
} from "@/components/shared/OnboardingCarousel";
import { BarChart3, Shirt, MapPin } from "lucide-react";

const slides: OnboardingSlide[] = [
  {
    Icon: BarChart3,
    title: "Grow your store",
    description:
      "List your shop and get discovered by nearby customers",
  },
  {
    Icon: Shirt,
    title: "Manage your catalogue",
    description: "Add products with photos, sizes, and colours",
  },
  {
    Icon: MapPin,
    title: "Be found locally",
    description: "Customers near you will see your store on the map",
  },
];

export default function ShopperOnboardingPage() {
  return <OnboardingCarousel role="shopper" slides={slides} />;
}
