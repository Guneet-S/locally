"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StoreCard from "@/components/shoppee/StoreCard";
import ProductCard from "@/components/shoppee/ProductCard";

type WishlistedStore = {
  id: string;
  name: string;
  cover_image_url: string | null;
  banner_url: string | null;
  categories: string[];
};

type WishlistedProduct = {
  id: string;
  name: string;
  price: number | null;
  photo_urls: string[];
  fabric: string | null;
  gsm: number | null;
  product_types: { name: string } | null;
  genders: { name: string } | null;
  product_variants: { qty: number }[];
};

interface WishlistTabsProps {
  storeCount: number;
  productCount: number;
  stores: WishlistedStore[];
  products: WishlistedProduct[];
  userId: string;
  defaultTab?: string;
}

export default function WishlistTabs({
  storeCount,
  productCount,
  stores,
  products,
  userId,
  defaultTab = "stores",
}: WishlistTabsProps) {
  const safeDefault =
    defaultTab === "products" || defaultTab === "stores"
      ? defaultTab
      : "stores";

  return (
    <Tabs defaultValue={safeDefault} className="mt-5">
      <TabsList className="grid w-full grid-cols-2 bg-shoppee-muted rounded-[10px]">
        <TabsTrigger
          value="stores"
          className="rounded-[8px] text-shoppee-textSecondary data-[state=active]:border-b-2 data-[state=active]:border-shoppee-primary data-[state=active]:text-shoppee-primary data-[state=active]:bg-white"
        >
          Stores ({storeCount})
        </TabsTrigger>
        <TabsTrigger
          value="products"
          className="rounded-[8px] text-shoppee-textSecondary data-[state=active]:border-b-2 data-[state=active]:border-shoppee-primary data-[state=active]:text-shoppee-primary data-[state=active]:bg-white"
        >
          Products ({productCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stores" className="mt-4">
        {stores.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center">
            <p className="font-serif text-h3 text-shoppee-textPrimary">
              No saved stores yet
            </p>
            <p className="mt-1 text-body text-shoppee-textSecondary">
              Tap the heart on any store to save it here.
            </p>
            <Link
              href="/explore"
              className="mt-6 rounded-[10px] bg-shoppee-primary px-6 py-3 text-button text-white"
            >
              Explore shops
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                wishlisted={true}
                showWishlist={true}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="products" className="mt-4">
        {products.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center">
            <p className="font-serif text-h3 text-shoppee-textPrimary">
              Save products you love
            </p>
            <p className="mt-1 text-body text-shoppee-textSecondary">
              Tap the heart on any product to save it here.
            </p>
            <Link
              href="/home"
              className="mt-6 rounded-[10px] bg-shoppee-primary px-6 py-3 text-button text-white"
            >
              Browse stores
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={true}
                userId={userId}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
