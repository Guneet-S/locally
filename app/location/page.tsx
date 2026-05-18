"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";

const CITIES = [
  { label: "Patiala", lat: 30.3398, lng: 76.3869 },
  { label: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { label: "Ludhiana", lat: 30.901, lng: 75.8573 },
  { label: "Amritsar", lat: 31.634, lng: 74.8723 },
];

export default function LocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const saveAndRedirect = (lat: number, lng: number) => {
    const payload = JSON.stringify({ lat, lng });
    localStorage.setItem("shoppee_location", payload);
    document.cookie = `shoppee_location=${encodeURIComponent(payload)}; path=/; max-age=31536000`;
    router.push("/home");
  };

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device");
      setShowManual(true);
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        saveAndRedirect(coords.latitude, coords.longitude);
      },
      () => {
        setError("Location denied. Choose a city instead.");
        setLoading(false);
        setShowManual(true);
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-shoppee-light">
        <MapPin size={28} strokeWidth={1.5} className="text-shoppee-primary" />
      </div>

      <h1 className="text-h1 text-text-primary">Find stores near you</h1>
      <p className="mt-2 text-body text-text-secondary">
        We need your location to show clothing stores in your area.
      </p>

      <button
        onClick={handleAllowLocation}
        disabled={loading}
        className="mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-[10px] bg-shoppee-primary py-3 text-button text-white disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MapPin size={16} strokeWidth={1.5} />
        )}
        {loading ? "Getting location..." : "Allow location access"}
      </button>

      {!showManual && (
        <button
          onClick={() => setShowManual(true)}
          className="mt-4 text-meta text-shoppee-primary"
        >
          Enter city manually
        </button>
      )}

      {error && <p className="mt-3 text-meta text-danger">{error}</p>}

      {showManual && (
        <div className="mt-6 w-full max-w-sm">
          <p className="mb-3 text-meta text-text-secondary">Select your city</p>
          <div className="flex flex-col gap-2">
            {CITIES.map((city) => (
              <button
                key={city.label}
                onClick={() => saveAndRedirect(city.lat, city.lng)}
                className="w-full rounded-[10px] border-[0.5px] border-border-subtle bg-surface py-3 text-h3 text-text-primary active:bg-shoppee-light"
              >
                {city.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
