import { z } from "zod";

export const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  contact_phone: z.string().min(6, "Contact phone is required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  lat: z.number(),
  lng: z.number(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be greater than 0"),
  category: z.enum([
    "kurta",
    "jeans",
    "sherwani",
    "shirt",
    "tshirt",
    "saree",
    "lehenga",
    "suit",
    "jacket",
    "other",
  ]),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  photo_urls: z.array(z.string()),
});

export type StoreInput = z.infer<typeof storeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
