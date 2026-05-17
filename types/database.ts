// Generated from SCHEMA.sql
// To regenerate: SUPABASE_ACCESS_TOKEN=<pat> pnpm dlx supabase gen types typescript --project-id lroycqcfnrxuvezapgda --schema public > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "shoppee" | "shopper";
          full_name: string;
          phone: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "shoppee" | "shopper";
          full_name: string;
          phone?: string | null;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "shoppee" | "shopper";
          full_name?: string;
          phone?: string | null;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          banner_url: string | null;
          address: string;
          city: string;
          location: unknown;
          opening_time: string | null;
          closing_time: string | null;
          contact_phone: string;
          categories: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          banner_url?: string | null;
          address: string;
          city?: string;
          location: unknown;
          opening_time?: string | null;
          closing_time?: string | null;
          contact_phone: string;
          categories?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          banner_url?: string | null;
          address?: string;
          city?: string;
          location?: unknown;
          opening_time?: string | null;
          closing_time?: string | null;
          contact_phone?: string;
          categories?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          price: number;
          category: Database["public"]["Enums"]["product_category"];
          sizes: Database["public"]["Enums"]["size_label"][];
          colors: string[];
          photo_urls: string[];
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          price: number;
          category: Database["public"]["Enums"]["product_category"];
          sizes?: Database["public"]["Enums"]["size_label"][];
          colors?: string[];
          photo_urls?: string[];
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          price?: number;
          category?: Database["public"]["Enums"]["product_category"];
          sizes?: Database["public"]["Enums"]["size_label"][];
          colors?: string[];
          photo_urls?: string[];
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          shoppee_id: string;
          store_id: string;
          created_at: string;
        };
        Insert: {
          shoppee_id: string;
          store_id: string;
          created_at?: string;
        };
        Update: {
          shoppee_id?: string;
          store_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      store_views: {
        Row: {
          id: number;
          store_id: string;
          viewer_id: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: number;
          store_id: string;
          viewer_id?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: number;
          store_id?: string;
          viewer_id?: string | null;
          viewed_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          store_id: string;
          shoppee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          shoppee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          shoppee_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      nearby_stores: {
        Args: {
          lat: number;
          lng: number;
          radius_m?: number;
          category_filter?: string | null;
        };
        Returns: {
          id: string;
          name: string;
          banner_url: string | null;
          address: string;
          categories: string[];
          is_open_now: boolean;
          distance_m: number;
          avg_rating: number;
        }[];
      };
    };
    Enums: {
      user_role: "shoppee" | "shopper";
      product_category:
        | "kurta"
        | "jeans"
        | "sherwani"
        | "shirt"
        | "tshirt"
        | "saree"
        | "lehenga"
        | "suit"
        | "jacket"
        | "other";
      size_label: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "Free";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
