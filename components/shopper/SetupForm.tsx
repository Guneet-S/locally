"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { MapPin, Upload, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  storeSchema,
  type StoreInput,
  type BusinessHoursDay,
} from "@/lib/validations/store";
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

const DAYS: BusinessHoursDay["day"][] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

const DAY_LABEL: Record<BusinessHoursDay["day"], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DEFAULT_HOURS: BusinessHoursDay[] = DAYS.map((day) => ({
  day,
  open: "10:00",
  close: "21:00",
  closed: day === "sun" ? true : false,
}));

const MAX_DESC = 500;

async function uploadImage(
  file: File,
  bucket: string,
  ownerId: string
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, { contentType: compressed.type });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export default function SetupForm() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locError, setLocError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHoursDay[]>(DEFAULT_HOURS);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      categories: [],
      business_hours: DEFAULT_HOURS,
      description: "",
    },
  });

  const description = watch("description") ?? "";

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Use JPG or PNG only");
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
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
        setLocError("Could not get location. Allow access or try again.");
        setIsGettingLocation(false);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
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

  const updateHourDay = (
    index: number,
    patch: Partial<BusinessHoursDay>
  ) => {
    const next = hours.map((h, i) => (i === index ? { ...h, ...patch } : h));
    setHours(next);
    setValue("business_hours", next);
  };

  const onSubmit = async (data: StoreInput) => {
    if (!location) {
      toast.error("Please share your location");
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not signed in");
        return;
      }

      let logoUrl: string | undefined;
      let coverUrl: string | undefined;
      if (logoFile) logoUrl = await uploadImage(logoFile, "store-logos", user.id);
      if (coverFile)
        coverUrl = await uploadImage(coverFile, "store-covers", user.id);

      const result = await createStoreAction({
        ...data,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
      });
      if (result?.error) toast.error(result.error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save store");
    }
  };

  // Track form values to keep hidden Controllers happy
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col px-4 pb-12 pt-10">
      <h1 className="text-h1 text-text-primary">List your shop</h1>
      <p className="mt-1 text-body text-text-secondary">Set up your store profile</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
        {/* Cover image */}
        <div>
          <p className="mb-2 text-meta text-text-secondary">Cover image</p>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted py-6 text-meta text-text-secondary"
          >
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-28 w-full rounded-[8px] object-cover"
              />
            ) : (
              <>
                <Upload size={20} strokeWidth={1.5} />
                <span>Upload cover (JPG/PNG)</span>
              </>
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleImageChange(e, setCoverFile, setCoverPreview)}
          />
        </div>

        {/* Logo */}
        <div>
          <p className="mb-2 text-meta text-text-secondary">Logo</p>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted p-3 text-meta text-text-secondary"
          >
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                <ImageIcon size={20} strokeWidth={1.5} />
              </div>
            )}
            <span>Upload logo</span>
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleImageChange(e, setLogoFile, setLogoPreview)}
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

        {/* Description */}
        <div>
          <textarea
            {...register("description")}
            placeholder="Description (optional)"
            rows={3}
            maxLength={MAX_DESC}
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          <p className="mt-1 text-right text-meta text-text-tertiary">
            {description.length}/{MAX_DESC}
          </p>
          {errors.description && (
            <p className="mt-1 text-meta text-danger">
              {errors.description.message}
            </p>
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

        {/* Phone & WhatsApp */}
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
        <div>
          <input
            {...register("whatsapp_number")}
            type="tel"
            placeholder="WhatsApp number (+91 optional)"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
        </div>

        {/* Business hours */}
        <div>
          <p className="mb-2 text-meta text-text-secondary">Business hours</p>
          <div className="flex flex-col gap-1.5">
            {hours.map((h, i) => (
              <div
                key={h.day}
                className="flex items-center gap-2 rounded-[8px] bg-surface-muted px-2 py-1.5"
              >
                <span className="w-9 text-meta text-text-secondary">
                  {DAY_LABEL[h.day]}
                </span>
                {h.closed ? (
                  <span className="flex-1 text-meta text-text-tertiary">
                    Closed
                  </span>
                ) : (
                  <>
                    <input
                      type="time"
                      value={h.open ?? ""}
                      onChange={(e) =>
                        updateHourDay(i, { open: e.target.value })
                      }
                      className="flex-1 rounded border-[0.5px] border-border-subtle bg-surface px-2 py-1 text-meta"
                    />
                    <input
                      type="time"
                      value={h.close ?? ""}
                      onChange={(e) =>
                        updateHourDay(i, { close: e.target.value })
                      }
                      className="flex-1 rounded border-[0.5px] border-border-subtle bg-surface px-2 py-1 text-meta"
                    />
                  </>
                )}
                <label className="flex items-center gap-1 text-meta text-text-tertiary">
                  <input
                    type="checkbox"
                    checked={h.closed}
                    onChange={(e) =>
                      updateHourDay(i, {
                        closed: e.target.checked,
                        open: e.target.checked ? null : "10:00",
                        close: e.target.checked ? null : "21:00",
                      })
                    }
                  />
                  Closed
                </label>
              </div>
            ))}
          </div>
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

        {/* Hidden controllers so RHF tracks lat/lng/categories/business_hours */}
        <Controller name="lat" control={control} render={() => <input type="hidden" />} />
        <Controller name="lng" control={control} render={() => <input type="hidden" />} />

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
