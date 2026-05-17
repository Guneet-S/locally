"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { productSchema, type ProductInput } from "@/lib/validations/store";
import { createProductAction } from "@/app/(shopper)/inventory/new/actions";

const PRODUCT_CATEGORIES = [
  { value: "kurta", label: "Kurta" },
  { value: "jeans", label: "Jeans" },
  { value: "sherwani", label: "Sherwani" },
  { value: "shirt", label: "Shirt" },
  { value: "tshirt", label: "T-shirt" },
  { value: "saree", label: "Saree" },
  { value: "lehenga", label: "Lehenga" },
  { value: "suit", label: "Suit" },
  { value: "jacket", label: "Jacket" },
  { value: "other", label: "Other" },
] as const;

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Free"];
const PRESET_COLORS = [
  "#1C1B22",
  "#FFFFFF",
  "#EF4444",
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
];

interface Props {
  storeId: string;
  ownerId: string;
}

export default function NewProductForm({ storeId, ownerId }: Props) {
  const router = useRouter();
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { sizes: [], colors: [], photo_urls: [] },
  });

  const handlePhotoChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFiles = [...photoFiles];
    const newPreviews = [...photoPreviews];
    newFiles[index] = file;
    newPreviews[index] = URL.createObjectURL(file);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (index: number) => {
    const newFiles = [...photoFiles];
    const newPreviews = [...photoPreviews];
    newFiles[index] = null;
    newPreviews[index] = null;
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const addCustomColor = () => {
    if (!selectedColors.includes(customColor)) toggleColor(customColor);
    setShowColorPicker(false);
  };

  const onSubmit = async (data: ProductInput) => {
    const supabase = createClient();
    const photoUrls: string[] = [];

    const filesToUpload = photoFiles.filter((f): f is File => f !== null);
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${ownerId}/${crypto.randomUUID()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-photos")
          .upload(path, compressed, { contentType: compressed.type });
        if (uploadError) throw uploadError;
        photoUrls.push(
          supabase.storage.from("product-photos").getPublicUrl(path).data
            .publicUrl
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Photo upload failed");
        return;
      }
    }

    const result = await createProductAction({
      ...data,
      store_id: storeId,
      photo_urls: photoUrls,
      sizes: selectedSizes,
      colors: selectedColors,
    });

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Product added");
      router.push("/inventory");
    }
  };

  return (
    <div className="px-4 pb-12 pt-10">
      <h1 className="text-h1 text-text-primary">Add product</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
        {/* Photo slots */}
        <div>
          <p className="mb-2 text-meta text-text-secondary">Photos (up to 4)</p>
          <div className="grid grid-cols-4 gap-2">
            {([0, 1, 2, 3] as const).map((index) => (
              <div key={index} className="relative aspect-square">
                {photoPreviews[index] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreviews[index]!}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full rounded-[8px] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-1 top-1 rounded-full bg-surface p-0.5"
                    >
                      <X
                        size={12}
                        strokeWidth={2}
                        className="text-danger"
                      />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="flex h-full w-full items-center justify-center rounded-[8px] border-[0.5px] border-border-subtle bg-surface-muted"
                  >
                    <Plus
                      size={16}
                      strokeWidth={1.5}
                      className="text-text-tertiary"
                    />
                  </button>
                )}
                <input
                  ref={(el) => {
                    fileInputRefs.current[index] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(index, e)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <input
            {...register("name")}
            placeholder="Product name"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.name && (
            <p className="mt-1 text-meta text-danger">{errors.name.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <input
            {...register("price", { valueAsNumber: true })}
            type="number"
            placeholder="Price (Rs.)"
            min={1}
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.price && (
            <p className="mt-1 text-meta text-danger">{errors.price.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <select
            {...register("category")}
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta"
          >
            <option value="">Select category</option>
            {PRODUCT_CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-meta text-danger">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Sizes */}
        <div>
          <p className="mb-2 text-meta text-text-secondary">Sizes</p>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`rounded-full border-[0.5px] px-3 py-1 text-meta transition-colors ${
                  selectedSizes.includes(size)
                    ? "border-shopper-primary bg-shopper-primary text-white"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <p className="mb-2 text-meta text-text-secondary">Colors</p>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleColor(color)}
                style={{ backgroundColor: color }}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  selectedColors.includes(color)
                    ? "scale-110 border-shopper-primary"
                    : "border-transparent"
                } ${color === "#FFFFFF" ? "border-border-subtle" : ""}`}
              />
            ))}
            {selectedColors
              .filter((c) => !PRESET_COLORS.includes(c))
              .map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  style={{ backgroundColor: color }}
                  className="h-7 w-7 scale-110 rounded-full border-2 border-shopper-primary"
                />
              ))}
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex h-7 w-7 items-center justify-center rounded-full border-[0.5px] border-border-subtle bg-surface-muted"
            >
              <Plus size={12} strokeWidth={2} className="text-text-secondary" />
            </button>
          </div>
          {showColorPicker && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-9 w-16 cursor-pointer rounded border-[0.5px] border-border-subtle"
              />
              <button
                type="button"
                onClick={addCustomColor}
                className="rounded-[9px] bg-shopper-primary px-3 py-1.5 text-meta text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="text-meta text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[10px] bg-shopper-primary py-3 text-button text-white disabled:opacity-60"
        >
          {isSubmitting ? "Adding product..." : "Add product"}
        </button>
      </form>
    </div>
  );
}
