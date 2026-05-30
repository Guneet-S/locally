"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { Upload, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  storeSchema,
  type StoreInput,
  type BusinessHoursDay,
} from "@/lib/validations/store";
import { updateStoreAction } from "@/app/(shopper)/setup/actions";

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
const MAX_DESC = 500;

interface InitialStore {
  id: string;
  name: string;
  address: string;
  description: string | null;
  contact_phone: string;
  whatsapp_number: string | null;
  categories: string[];
  logo_url: string | null;
  cover_image_url: string | null;
  business_hours: BusinessHoursDay[] | null;
  completeness_score: number;
}

interface Props {
  initial: InitialStore;
}

function defaultHours(): BusinessHoursDay[] {
  return DAYS.map((day) => ({
    day,
    open: "10:00",
    close: "21:00",
    closed: day === "sun",
  }));
}

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

export default function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const [hours, setHours] = useState<BusinessHoursDay[]>(
    initial.business_hours && initial.business_hours.length === 7
      ? initial.business_hours
      : defaultHours()
  );
  const [categories, setCategories] = useState<string[]>(initial.categories ?? []);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logo_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial.cover_image_url
  );
  const [completeness, setCompleteness] = useState(initial.completeness_score);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: initial.name,
      address: initial.address,
      description: initial.description ?? "",
      contact_phone: initial.contact_phone,
      whatsapp_number: initial.whatsapp_number ?? "",
      categories: initial.categories,
      business_hours: hours,
      // lat/lng not edited in settings; supply current placeholder (validators
      // require numbers but updateStoreAction ignores them)
      lat: 0,
      lng: 0,
    },
  });

  const description = watch("description") ?? "";

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const updateHourDay = (
    index: number,
    patch: Partial<BusinessHoursDay>
  ) => {
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, ...patch } : h))
    );
  };

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

  const onSubmit = async (data: StoreInput) => {
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

      const result = await updateStoreAction({
        name: data.name,
        address: data.address,
        description: data.description,
        contact_phone: data.contact_phone,
        whatsapp_number: data.whatsapp_number,
        categories,
        business_hours: hours,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Store updated");

      // Re-fetch completeness score
      const { data: row } = await supabase
        .from("stores")
        .select("completeness_score")
        .eq("id", initial.id)
        .maybeSingle();
      if (row) setCompleteness(row.completeness_score);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-5"
    >
      {/* Completeness */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-meta text-text-secondary">Profile completeness</p>
          <p className="text-meta text-text-secondary">{completeness}%</p>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-shopper-primary"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* Cover */}
      <div>
        <p className="mb-2 text-meta text-text-secondary">Cover image</p>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted py-4 text-meta text-text-secondary"
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
              <span>Upload cover</span>
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

      <div>
        <textarea
          {...register("description")}
          rows={3}
          maxLength={MAX_DESC}
          placeholder="Description (optional)"
          className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
        />
        <p className="mt-1 text-right text-meta text-text-tertiary">
          {description.length}/{MAX_DESC}
        </p>
      </div>

      <div>
        <textarea
          {...register("address")}
          rows={3}
          placeholder="Address"
          className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
        />
        {errors.address && (
          <p className="mt-1 text-meta text-danger">{errors.address.message}</p>
        )}
      </div>

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
          placeholder="WhatsApp number"
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

      <div>
        <p className="mb-2 text-meta text-text-secondary">Categories</p>
        <div className="flex flex-wrap gap-2">
          {STORE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full border-[0.5px] px-3 py-1 text-meta transition-colors ${
                categories.includes(cat)
                  ? "border-shopper-primary bg-shopper-primary text-white"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[10px] bg-shopper-primary py-3 text-button text-white disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
