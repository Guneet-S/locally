"use server";

import { cookies } from "next/headers";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Patiala: { lat: 30.3398, lng: 76.3869 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Ludhiana: { lat: 30.901, lng: 75.8573 },
  Amritsar: { lat: 31.634, lng: 74.8723 },
};

export async function changeCityAction(city: string): Promise<void> {
  const cookieStore = cookies();

  if (city === "auto") {
    // Clear the cookie so the user is redirected to /location to auto-detect
    cookieStore.delete("shoppee_location");
    return;
  }

  const coords = CITY_COORDS[city];
  if (!coords) return;

  const value = encodeURIComponent(JSON.stringify(coords));
  cookieStore.set("shoppee_location", value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
