"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { MapPin, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { storeSchema, type StoreInput } from "@/lib/validations/store";
import { createStoreAction } from "@/app/(shopper)/setup/actions";

const STORE_CATEGORIES = [
  "Men",
  "Women",
  "Kids",
  "Ethnic",
  "Casual",
  "Formal",
  "Western",
];

export default function SetupForm() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locError, setLocError] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: { categories: [] },
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerPreview(URL.createObjectURL(file));
    setBannerFile(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported on this device");
      return;
    }
    setIsGettingLocation(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setLocation({ lat, lng });
        setValue("lat", lat, { shouldValidate: true });
        setValue("lng", lng, { shouldValidate: true });
        setIsGettingLocation(false);
      },
      () => {
        setLocError("Location denied. Enable location access and try again.");
        setIsGettingLocation(false);
      }
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat];
      setValue("categories", next, { shouldValidate: true });
      return next;
    });
  };

  const onSubmit = async (data: StoreInput) => {
    let bannerUrl: string | undefined;

    if (bannerFile) {
      try {
        const compressed = await imageCompression(bannerFile, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ext = bannerFile.name.split(".").pop() ?? "jpg";
        const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("store-banners")
          .upload(path, compressed, { contentType: compressed.type });
        if (uploadError) throw uploadError;
        bannerUrl = supabase.storage
          .from("store-banners")
          .getPublicUrl(path).data.publicUrl;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Photo upload failed");
        return;
      }
    }

    const result = await createStoreAction({ ...data, banner_url: bannerUrl });
    if (result?.error) toast.error(result.error);
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-12 pt-10">
      <h1 className="text-h1 text-text-primary">List your shop</h1>
      <p className="mt-1 text-body text-text-secondary">Set up your store profile</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
        {/* Banner */}
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted py-8 text-meta text-text-secondary"
          >
            {bannerPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="h-28 w-full rounded-[8px] object-cover"
              />
            ) : (
              <>
                <Upload size={20} strokeWidth={1.5} />
                <span>Upload banner (optional)</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
        </div>

        {/* Store name */}
        <div>
          <input
            {...register("name")}
            placeholder="Store name"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.name && (
            <p className="mt-1 text-meta text-danger">{errors.name.message}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <textarea
            {...register("address")}
            placeholder="Full address"
            rows={3}
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.address && (
            <p className="mt-1 text-meta text-danger">{errors.address.message}</p>
          )}
        </div>

        {/* Hours */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-meta text-text-secondary">Opening time</label>
            <input
              {...register("opening_time")}
              type="time"
              className="mt-1 w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta"
            />
          </div>
          <div className="flex-1">
            <label className="text-meta text-text-secondary">Closing time</label>
            <input
              {...register("closing_time")}
              type="time"
              className="mt-1 w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <input
            {...register("contact_phone")}
            type="tel"
            placeholder="Contact phone"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.contact_phone && (
            <p className="mt-1 text-meta text-danger">
              {errors.contact_phone.message}
            </p>
          )}
        </div>

        {/* Categories */}
        <div>
          <p className="mb-2 text-meta text-text-secondary">Categories</p>
          <div className="flex flex-wrap gap-2">
            {STORE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border-[0.5px] px-3 py-1 text-meta transition-colors ${
                  selectedCategories.includes(cat)
                    ? "border-shopper-primary bg-shopper-primary text-white"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.categories && (
            <p className="mt-1 text-meta text-danger">
              {errors.categories.message}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-shopper-primary py-3 text-button text-shopper-primary disabled:opacity-60"
          >
            <MapPin size={16} strokeWidth={1.5} />
            {isGettingLocation
              ? "Getting location..."
              : location
                ? `Captured: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : "Use my current location"}
          </button>
          {locError && (
            <p className="mt-1 text-meta text-danger">{locError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !location}
          className="w-full rounded-[10px] bg-shopper-primary py-3 text-button text-white disabled:opacity-60"
        >
          {isSubmitting ? "Creating store..." : "List my shop"}
        </button>
      </form>
    </div>
  );
}
