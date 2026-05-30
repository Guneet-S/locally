import { z } from "zod";

// ============================================================
// Store schema (v2)
// ============================================================
// Used by both the initial /setup form and the /settings edit form.
// Image URLs (logo_url, cover_image_url) are uploaded client-side before
// the action runs and passed in as already-resolved public URLs.

export const businessHoursDaySchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  open: z.string().nullable(),
  close: z.string().nullable(),
  closed: z.boolean(),
});

export type BusinessHoursDay = z.infer<typeof businessHoursDaySchema>;

export const businessHoursSchema = z.array(businessHoursDaySchema).length(7);

export const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
  description: z.string().max(500, "Max 500 characters").optional(),
  whatsapp_number: z.string().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  contact_phone: z.string().min(6, "Contact phone is required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  business_hours: businessHoursSchema.optional(),
  lat: z.number(),
  lng: z.number(),
});

export type StoreInput = z.infer<typeof storeSchema>;

// ============================================================
// Product wizard schemas (v2)
// ============================================================
// Each step validates a slice of state. The final submit re-validates the
// full payload.

export const productStep1Schema = z.object({
  gender_id: z.number().int().positive("Select a gender"),
  category_id: z.number().int().positive("Select a category"),
  type_id: z.number().int().positive("Select a product type"),
});

export const productStep2Schema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be 0 or more").optional(),
  status: z.enum(["draft", "active"]),
});

const ALLOWED_FABRIC = [
  "Cotton",
  "Cotton Blend",
  "Polyester",
  "Rayon",
  "Linen",
  "Denim",
  "Silk",
] as const;
const ALLOWED_FIT = ["Slim", "Regular", "Relaxed", "Oversized"] as const;

export const productStep3Schema = z.object({
  fabric: z.enum(ALLOWED_FABRIC).optional().or(z.literal("")),
  gsm: z
    .number()
    .int()
    .min(50, "Min 50 GSM")
    .max(500, "Max 500 GSM")
    .optional(),
  fit: z.enum(ALLOWED_FIT).optional().or(z.literal("")),
  pattern: z.string().optional(),
  sleeve_type: z.string().optional(),
  neck_type: z.string().optional(),
  occasion: z.string().optional(),
  season: z.string().optional(),
  wash_care: z.string().optional(),
});

export const productStep4Schema = z.object({
  colors: z.array(z.string().min(1)).min(1, "Select at least one color"),
  sizes: z.array(z.string().min(1)).min(1, "Select at least one size"),
});

export const productStep5VariantSchema = z.object({
  color: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().min(0),
  sku: z.string().optional(),
});
export const productStep5Schema = z.object({
  variants: z.array(productStep5VariantSchema).min(1),
});

export const productStep6Schema = z.object({
  photo_urls: z.array(z.string().url()).min(1, "Add at least one photo").max(4),
});

export const productFullSchema = productStep1Schema
  .merge(productStep2Schema)
  .merge(productStep3Schema)
  .merge(productStep4Schema)
  .merge(productStep5Schema)
  .merge(productStep6Schema);

export type ProductFullInput = z.infer<typeof productFullSchema>;
export type ProductVariantInput = z.infer<typeof productStep5VariantSchema>;
