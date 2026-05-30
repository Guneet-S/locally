"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { Plus, X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createProductAction } from "@/app/(shopper)/inventory/new/actions";
import {
  productStep1Schema,
  productStep2Schema,
  productStep3Schema,
  productStep4Schema,
  productStep5Schema,
  productStep6Schema,
} from "@/lib/validations/store";

// ============================================================
// Wizard taxonomy types (mirror DB lookup tables)
// ============================================================
export interface Gender {
  id: number;
  name: string;
}
export interface Category {
  id: number;
  gender_id: number;
  name: string;
}
export interface ProductType {
  id: number;
  category_id: number;
  name: string;
}

interface Props {
  storeId: string;
  storeNameAbbrev: string;
  ownerId: string;
  genders: Gender[];
  categories: Category[];
  types: ProductType[];
}

// ============================================================
// Static option lists
// ============================================================
const FABRIC_OPTIONS = [
  "",
  "Cotton",
  "Cotton Blend",
  "Polyester",
  "Rayon",
  "Linen",
  "Denim",
  "Silk",
];
const FIT_OPTIONS = ["", "Slim", "Regular", "Relaxed", "Oversized"];

const PRESET_COLORS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Brown",
  "Grey",
  "Beige",
  "Navy",
  "Maroon",
];
const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

// ============================================================
// Wizard state
// ============================================================
interface WizardState {
  // step 1
  gender_id: number | null;
  category_id: number | null;
  type_id: number | null;
  // step 2
  name: string;
  description: string;
  price: string; // string in form, parsed on submit
  status: "draft" | "active";
  // step 3
  fabric: string;
  gsm: string;
  fit: string;
  pattern: string;
  sleeve_type: string;
  neck_type: string;
  occasion: string;
  season: string;
  wash_care: string;
  // step 4
  colors: string[];
  sizes: string[];
  // step 5
  variants: Record<string, { qty: number; sku: string }>; // key = `${color}|${size}`
  // step 6
  photoFiles: (File | null)[];
  photoPreviews: (string | null)[];
}

const EMPTY_STATE: WizardState = {
  gender_id: null,
  category_id: null,
  type_id: null,
  name: "",
  description: "",
  price: "",
  status: "draft",
  fabric: "",
  gsm: "",
  fit: "",
  pattern: "",
  sleeve_type: "",
  neck_type: "",
  occasion: "",
  season: "",
  wash_care: "",
  colors: [],
  sizes: [],
  variants: {},
  photoFiles: [null, null, null, null],
  photoPreviews: [null, null, null, null],
};

function abbrev3(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}

function variantKey(color: string, size: string) {
  return `${color}|${size}`;
}

// ============================================================
// Main wizard
// ============================================================
export default function NewProductWizard({
  storeId,
  storeNameAbbrev,
  ownerId,
  genders,
  categories,
  types,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [state, setState] = useState<WizardState>(EMPTY_STATE);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  // Browser-back warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // Only warn if user has progressed
      if (state.gender_id || state.name) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.gender_id, state.name]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.gender_id === state.gender_id),
    [categories, state.gender_id]
  );
  const filteredTypes = useMemo(
    () => types.filter((t) => t.category_id === state.category_id),
    [types, state.category_id]
  );

  const selectedType = useMemo(
    () => types.find((t) => t.id === state.type_id),
    [types, state.type_id]
  );

  const update = (patch: Partial<WizardState>) =>
    setState((s) => ({ ...s, ...patch }));

  // ===== Step 1 navigation =====
  const handleGender = (gender_id: number) =>
    update({ gender_id, category_id: null, type_id: null });
  const handleCategory = (category_id: number) =>
    update({ category_id, type_id: null });
  const handleType = (type_id: number) => update({ type_id });

  // ===== Step 4 =====
  const toggleColor = (color: string) =>
    update({
      colors: state.colors.includes(color)
        ? state.colors.filter((c) => c !== color)
        : [...state.colors, color],
    });
  const toggleSize = (size: string) =>
    update({
      sizes: state.sizes.includes(size)
        ? state.sizes.filter((s) => s !== size)
        : [...state.sizes, size],
    });

  // ===== Step 5: rebuild grid when colors/sizes change =====
  useEffect(() => {
    setState((s) => {
      const next: WizardState["variants"] = {};
      for (const c of s.colors) {
        for (const sz of s.sizes) {
          const key = variantKey(c, sz);
          next[key] = s.variants[key] ?? { qty: 0, sku: "" };
        }
      }
      return { ...s, variants: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.colors.join(","), state.sizes.join(",")]);

  const totalQty = useMemo(
    () => Object.values(state.variants).reduce((sum, v) => sum + v.qty, 0),
    [state.variants]
  );

  // ===== Step 6 photos =====
  const handlePhotoChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const files = [...state.photoFiles];
    const previews = [...state.photoPreviews];
    files[index] = file;
    previews[index] = URL.createObjectURL(file);
    update({ photoFiles: files, photoPreviews: previews });
  };

  const removePhoto = (index: number) => {
    const files = [...state.photoFiles];
    const previews = [...state.photoPreviews];
    files[index] = null;
    previews[index] = null;
    update({ photoFiles: files, photoPreviews: previews });
  };

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to > 3) return;
    const files = [...state.photoFiles];
    const previews = [...state.photoPreviews];
    [files[from], files[to]] = [files[to], files[from]];
    [previews[from], previews[to]] = [previews[to], previews[from]];
    update({ photoFiles: files, photoPreviews: previews });
  };

  // ===== Step validation =====
  const validateStep = (s: 1 | 2 | 3 | 4 | 5 | 6): string | null => {
    if (s === 1) {
      const r = productStep1Schema.safeParse({
        gender_id: state.gender_id,
        category_id: state.category_id,
        type_id: state.type_id,
      });
      return r.success ? null : r.error.issues[0]?.message ?? "Invalid";
    }
    if (s === 2) {
      const priceNum = state.price.trim() === "" ? undefined : Number(state.price);
      const r = productStep2Schema.safeParse({
        name: state.name,
        description: state.description || undefined,
        price: priceNum,
        status: state.status,
      });
      return r.success ? null : r.error.issues[0]?.message ?? "Invalid";
    }
    if (s === 3) {
      const gsmNum = state.gsm.trim() === "" ? undefined : Number(state.gsm);
      const r = productStep3Schema.safeParse({
        fabric: state.fabric || undefined,
        gsm: gsmNum,
        fit: state.fit || undefined,
      });
      return r.success ? null : r.error.issues[0]?.message ?? "Invalid";
    }
    if (s === 4) {
      const r = productStep4Schema.safeParse({
        colors: state.colors,
        sizes: state.sizes,
      });
      return r.success ? null : r.error.issues[0]?.message ?? "Invalid";
    }
    if (s === 5) {
      const variants = Object.entries(state.variants).map(([k, v]) => {
        const [color, size] = k.split("|");
        return { color, size, qty: v.qty, sku: v.sku || undefined };
      });
      const r = productStep5Schema.safeParse({ variants });
      return r.success ? null : r.error.issues[0]?.message ?? "Invalid";
    }
    if (s === 6) {
      const urls = state.photoFiles.filter((f) => f !== null).map(() => "https://placeholder/p");
      const r = productStep6Schema.safeParse({ photo_urls: urls });
      return r.success ? null : r.error.issues[0]?.message ?? "Invalid";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => (s < 6 ? ((s + 1) as 1 | 2 | 3 | 4 | 5 | 6) : s));
  };

  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5 | 6) : s));

  // ===== Submit =====
  const handleSubmit = async (publish: boolean) => {
    // Re-validate everything before publishing; drafts can skip later steps.
    if (publish) {
      for (const s of [1, 2, 3, 4, 5, 6] as const) {
        const err = validateStep(s);
        if (err) {
          toast.error(`Step ${s}: ${err}`);
          setStep(s);
          return;
        }
      }
    } else {
      // Minimum for draft: name + taxonomy (steps 1 + 2 name)
      if (!state.gender_id || !state.category_id || !state.type_id) {
        toast.error("Select category before saving draft");
        setStep(1);
        return;
      }
      if (!state.name.trim()) {
        toast.error("Add a name to save draft");
        setStep(2);
        return;
      }
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // Upload photos
      const photoUrls: string[] = [];
      const photoFiles = state.photoFiles.filter((f): f is File => f !== null);
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const compressed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${ownerId}/${crypto.randomUUID()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("product-photos")
          .upload(path, compressed, { contentType: compressed.type });
        if (uploadErr) throw uploadErr;
        photoUrls.push(
          supabase.storage.from("product-photos").getPublicUrl(path).data
            .publicUrl
        );
      }

      // Build variants array
      const variants = Object.entries(state.variants).map(([key, v]) => {
        const [color, size] = key.split("|");
        const typeAbbrev = abbrev3(selectedType?.name ?? "ITM");
        const colorAbbrev = abbrev3(color);
        const autoSku =
          v.sku.trim() || `${storeNameAbbrev}-${typeAbbrev}-${colorAbbrev}-${size}`;
        return {
          color,
          size,
          qty: v.qty,
          sku: autoSku,
        };
      });

      const result = await createProductAction({
        store_id: storeId,
        name: state.name,
        description: state.description || undefined,
        price: state.price ? Number(state.price) : undefined,
        gender_id: state.gender_id!,
        category_id: state.category_id!,
        type_id: state.type_id!,
        status: publish ? "active" : "draft",
        fabric: (state.fabric || undefined) as never,
        gsm: state.gsm ? Number(state.gsm) : undefined,
        fit: (state.fit || undefined) as never,
        pattern: state.pattern || undefined,
        sleeve_type: state.sleeve_type || undefined,
        neck_type: state.neck_type || undefined,
        occasion: state.occasion || undefined,
        season: state.season || undefined,
        wash_care: state.wash_care || undefined,
        colors: state.colors,
        sizes: state.sizes,
        photo_urls: photoUrls,
        variants,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(publish ? "Product published" : "Saved as draft");
      router.push("/inventory");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24 pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-text-primary">Add product</h1>
        <span className="text-meta text-text-tertiary">{step} / 6</span>
      </div>
      <ProgressBar step={step} />

      <div className="mt-6">
        {step === 1 && (
          <Step1
            genders={genders}
            filteredCategories={filteredCategories}
            filteredTypes={filteredTypes}
            state={state}
            onGender={handleGender}
            onCategory={handleCategory}
            onType={handleType}
          />
        )}
        {step === 2 && (
          <Step2 state={state} update={update} />
        )}
        {step === 3 && <Step3 state={state} update={update} />}
        {step === 4 && (
          <Step4
            state={state}
            onToggleColor={toggleColor}
            onToggleSize={toggleSize}
            onAddCustomColor={(c) => {
              const clean = c.trim();
              if (!clean) return;
              if (!state.colors.includes(clean)) toggleColor(clean);
            }}
            onAddCustomSize={(s) => {
              const clean = s.trim();
              if (!clean) return;
              if (!state.sizes.includes(clean)) toggleSize(clean);
            }}
          />
        )}
        {step === 5 && (
          <Step5
            state={state}
            totalQty={totalQty}
            onVariantChange={(color, size, patch) =>
              update({
                variants: {
                  ...state.variants,
                  [variantKey(color, size)]: {
                    ...(state.variants[variantKey(color, size)] ?? {
                      qty: 0,
                      sku: "",
                    }),
                    ...patch,
                  },
                },
              })
            }
          />
        )}
        {step === 6 && (
          <Step6
            state={state}
            fileInputRefs={fileInputRefs}
            onPhotoChange={handlePhotoChange}
            onRemovePhoto={removePhoto}
            onMovePhoto={movePhoto}
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border border-border-subtle py-3 text-button text-text-secondary disabled:opacity-40"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back
          </button>
          {step < 6 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-1 rounded-[10px] bg-shopper-primary py-3 text-button text-white"
            >
              Next
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex flex-1 items-center justify-center rounded-[10px] bg-shopper-primary py-3 text-button text-white disabled:opacity-60"
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="rounded-[10px] border border-shopper-primary py-3 text-button text-shopper-primary disabled:opacity-60"
        >
          Save as draft
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Reusable bits
// ============================================================
function ProgressBar({ step }: { step: number }) {
  const pct = (step / 6) * 100;
  return (
    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
      <div
        className="h-full bg-shopper-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-meta text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary";

// ============================================================
// Step components
// ============================================================
function Step1({
  genders,
  filteredCategories,
  filteredTypes,
  state,
  onGender,
  onCategory,
  onType,
}: {
  genders: Gender[];
  filteredCategories: Category[];
  filteredTypes: ProductType[];
  state: WizardState;
  onGender: (id: number) => void;
  onCategory: (id: number) => void;
  onType: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h2 text-text-primary">Choose category</h2>
      <Field label="Gender">
        <div className="flex flex-wrap gap-2">
          {genders.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onGender(g.id)}
              className={`rounded-full border-[0.5px] px-3 py-1 text-meta ${
                state.gender_id === g.id
                  ? "border-shopper-primary bg-shopper-primary text-white"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </Field>

      {state.gender_id != null && (
        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCategory(c.id)}
                className={`rounded-full border-[0.5px] px-3 py-1 text-meta ${
                  state.category_id === c.id
                    ? "border-shopper-primary bg-shopper-primary text-white"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </Field>
      )}

      {state.category_id != null && (
        <Field label="Product type">
          <div className="flex flex-wrap gap-2">
            {filteredTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onType(t.id)}
                className={`rounded-full border-[0.5px] px-3 py-1 text-meta ${
                  state.type_id === t.id
                    ? "border-shopper-primary bg-shopper-primary text-white"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}

function Step2({
  state,
  update,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h2 text-text-primary">Product details</h2>
      <Field label="Name *">
        <input
          value={state.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Cotton T-shirt"
          className={inputCls}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={state.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          className={inputCls}
        />
      </Field>
      <Field label="Price (Rs.)">
        <input
          type="number"
          min="0"
          step="1"
          value={state.price}
          onChange={(e) => update({ price: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Status">
        <div className="flex gap-2">
          {(["draft", "active"] as const).map((s) => (
            <label
              key={s}
              className={`flex flex-1 cursor-pointer items-center justify-center rounded-[10px] border-[0.5px] py-2.5 text-meta ${
                state.status === s
                  ? "border-shopper-primary bg-shopper-primary text-white"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={state.status === s}
                onChange={() => update({ status: s })}
                className="sr-only"
              />
              {s === "draft" ? "Draft" : "Active"}
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Step3({
  state,
  update,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h2 text-text-primary">Fabric &amp; fit</h2>
      <Field label="Fabric">
        <select
          value={state.fabric}
          onChange={(e) => update({ fabric: e.target.value })}
          className={inputCls}
        >
          {FABRIC_OPTIONS.map((f) => (
            <option key={f || "unspecified"} value={f}>
              {f || "Unspecified"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="GSM (50-500)">
        <input
          type="number"
          min="50"
          max="500"
          value={state.gsm}
          onChange={(e) => update({ gsm: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Fit">
        <select
          value={state.fit}
          onChange={(e) => update({ fit: e.target.value })}
          className={inputCls}
        >
          {FIT_OPTIONS.map((f) => (
            <option key={f || "unspecified"} value={f}>
              {f || "Unspecified"}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pattern">
          <input
            value={state.pattern}
            onChange={(e) => update({ pattern: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Sleeve">
          <input
            value={state.sleeve_type}
            onChange={(e) => update({ sleeve_type: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Neck">
          <input
            value={state.neck_type}
            onChange={(e) => update({ neck_type: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Occasion">
          <input
            value={state.occasion}
            onChange={(e) => update({ occasion: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Season">
          <input
            value={state.season}
            onChange={(e) => update({ season: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Wash care">
          <input
            value={state.wash_care}
            onChange={(e) => update({ wash_care: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

function Step4({
  state,
  onToggleColor,
  onToggleSize,
  onAddCustomColor,
  onAddCustomSize,
}: {
  state: WizardState;
  onToggleColor: (c: string) => void;
  onToggleSize: (s: string) => void;
  onAddCustomColor: (c: string) => void;
  onAddCustomSize: (s: string) => void;
}) {
  const [customColor, setCustomColor] = useState("");
  const [customSize, setCustomSize] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h2 text-text-primary">Colors &amp; sizes</h2>
      <Field label="Colors">
        <div className="flex flex-wrap gap-2">
          {[...PRESET_COLORS, ...state.colors.filter((c) => !PRESET_COLORS.includes(c))].map(
            (c) => (
              <button
                key={c}
                type="button"
                onClick={() => onToggleColor(c)}
                className={`rounded-full border-[0.5px] px-3 py-1 text-meta ${
                  state.colors.includes(c)
                    ? "border-shopper-primary bg-shopper-primary text-white"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                {c}
              </button>
            )
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="Other color"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => {
              onAddCustomColor(customColor);
              setCustomColor("");
            }}
            className="rounded-[9px] bg-shopper-primary px-3 text-button text-white"
          >
            Add
          </button>
        </div>
      </Field>

      <Field label="Sizes">
        <div className="flex flex-wrap gap-2">
          {[...PRESET_SIZES, ...state.sizes.filter((s) => !PRESET_SIZES.includes(s))].map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => onToggleSize(s)}
                className={`rounded-full border-[0.5px] px-3 py-1 text-meta ${
                  state.sizes.includes(s)
                    ? "border-shopper-primary bg-shopper-primary text-white"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            placeholder="Other size (e.g. 28, 32)"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => {
              onAddCustomSize(customSize);
              setCustomSize("");
            }}
            className="rounded-[9px] bg-shopper-primary px-3 text-button text-white"
          >
            Add
          </button>
        </div>
      </Field>
    </div>
  );
}

function Step5({
  state,
  totalQty,
  onVariantChange,
}: {
  state: WizardState;
  totalQty: number;
  onVariantChange: (
    color: string,
    size: string,
    patch: Partial<{ qty: number; sku: string }>
  ) => void;
}) {
  if (state.colors.length === 0 || state.sizes.length === 0) {
    return (
      <p className="text-body text-text-tertiary">
        Pick colors and sizes first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-text-primary">Inventory</h2>
        <span className="text-meta text-text-tertiary">Total qty: {totalQty}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-meta text-text-tertiary">Color</th>
              {state.sizes.map((s) => (
                <th
                  key={s}
                  className="text-center text-meta text-text-tertiary"
                >
                  {s}
                </th>
              ))}
              <th className="text-left text-meta text-text-tertiary">SKU</th>
            </tr>
          </thead>
          <tbody>
            {state.colors.map((c) => (
              <tr key={c}>
                <td className="pr-2 text-meta text-text-secondary">{c}</td>
                {state.sizes.map((s) => {
                  const v = state.variants[variantKey(c, s)];
                  return (
                    <td key={s} className="px-1">
                      <input
                        type="number"
                        min="0"
                        value={v?.qty ?? 0}
                        onChange={(e) =>
                          onVariantChange(c, s, {
                            qty: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-14 rounded border-[0.5px] border-border-subtle bg-surface-muted px-1.5 py-1 text-center text-meta"
                      />
                    </td>
                  );
                })}
                <td className="pl-2">
                  <input
                    placeholder="auto"
                    value={state.variants[variantKey(c, state.sizes[0])]?.sku ?? ""}
                    onChange={(e) => {
                      // Apply the same SKU to all sizes for this color (one SKU per row)
                      for (const s of state.sizes) {
                        onVariantChange(c, s, { sku: e.target.value });
                      }
                    }}
                    className="w-28 rounded border-[0.5px] border-border-subtle bg-surface-muted px-1.5 py-1 text-meta"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Step6({
  state,
  fileInputRefs,
  onPhotoChange,
  onRemovePhoto,
  onMovePhoto,
}: {
  state: WizardState;
  fileInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onPhotoChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onRemovePhoto: (index: number) => void;
  onMovePhoto: (from: number, to: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-h2 text-text-primary">Photos</h2>
      <p className="text-meta text-text-tertiary">
        Up to 4 photos. First is the thumbnail.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {([0, 1, 2, 3] as const).map((index) => (
          <div key={index} className="relative aspect-square">
            {state.photoPreviews[index] ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.photoPreviews[index]!}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full rounded-[8px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute right-1 top-1 rounded-full bg-surface p-0.5"
                >
                  <X size={12} strokeWidth={2} className="text-danger" />
                </button>
                <div className="absolute bottom-1 right-1 flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => onMovePhoto(index, index - 1)}
                    className="rounded-full bg-surface p-0.5"
                  >
                    <ArrowUp size={12} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMovePhoto(index, index + 1)}
                    className="rounded-full bg-surface p-0.5"
                  >
                    <ArrowDown size={12} strokeWidth={2} />
                  </button>
                </div>
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-shopper-primary px-2 py-0.5 text-[10px] text-white">
                    Primary
                  </span>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRefs.current[index]?.click()}
                className="flex h-full w-full items-center justify-center rounded-[8px] border-[0.5px] border-border-subtle bg-surface-muted"
              >
                <Plus size={16} strokeWidth={1.5} className="text-text-tertiary" />
              </button>
            )}
            <input
              ref={(el) => {
                fileInputRefs.current[index] = el;
              }}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => onPhotoChange(index, e)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
