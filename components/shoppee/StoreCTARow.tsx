"use client";

import { MessageCircle, Navigation, Phone } from "lucide-react";
import { logContactEvent } from "@/app/(shoppee)/store/[id]/actions";

interface StoreCTARowProps {
  storeId: string;
  contactPhone: string;
  whatsappNumber: string | null;
  lat: number;
  lng: number;
}

export default function StoreCTARow({
  storeId,
  contactPhone,
  whatsappNumber,
  lat,
  lng,
}: StoreCTARowProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const callUrl = `tel:${contactPhone}`;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, saw your shop on Locally")}`
    : null;

  return (
    <div className="mt-4 flex gap-2">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logContactEvent(storeId, "whatsapp")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-shoppee-primary bg-transparent py-3 text-button text-shoppee-primary active:bg-shoppee-primary active:text-white"
        >
          <MessageCircle size={16} strokeWidth={1.5} />
          WhatsApp
        </a>
      )}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => logContactEvent(storeId, "directions")}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-shoppee-primary bg-transparent py-3 text-button text-shoppee-primary active:bg-shoppee-primary active:text-white"
      >
        <Navigation size={16} strokeWidth={1.5} />
        Directions
      </a>
      <a
        href={callUrl}
        onClick={() => logContactEvent(storeId, "call")}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-shoppee-primary bg-transparent py-3 text-button text-shoppee-primary active:bg-shoppee-primary active:text-white"
      >
        <Phone size={16} strokeWidth={1.5} />
        Call
      </a>
    </div>
  );
}
