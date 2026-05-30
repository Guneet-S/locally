import Link from "next/link";

interface StoreCardProps {
  store: {
    id: string;
    name: string;
    cover_image_url?: string | null;
    banner_url?: string | null;
    categories: string[];
    is_open_now?: boolean;
    distance_m?: number;
    product_count?: number;
  };
  wishlisted?: boolean;
  showWishlist?: boolean;
}

export default function StoreCard({
  store,
}: StoreCardProps) {
  const imageSrc = store.cover_image_url ?? store.banner_url ?? null;

  return (
    <Link href={`/store/${store.id}`} className="block">
      <div className="bg-white rounded-[10px] shadow-sm border border-shoppee-border hover:shadow-md transition-shadow overflow-hidden">
        {/* Cover image */}
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={store.name}
            className="h-32 w-full object-cover rounded-t-[10px]"
          />
        ) : (
          <div className="h-32 w-full bg-shoppee-muted rounded-t-[10px] flex items-center justify-center">
            <span className="font-serif text-4xl text-shoppee-primary">
              {store.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="p-3">
          <p className="font-serif text-h3 text-shoppee-textPrimary line-clamp-1">
            {store.name}
          </p>

          {/* Category pills */}
          {store.categories.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {store.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="bg-shoppee-muted text-shoppee-primary text-meta rounded-full px-2 py-0.5"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Distance + open/closed row */}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {store.distance_m !== undefined && (
              <span className="text-meta text-shoppee-textSecondary italic">
                {store.distance_m < 1000
                  ? `${Math.round(store.distance_m)}m away`
                  : `${(store.distance_m / 1000).toFixed(1)} km away`}
              </span>
            )}
            {store.is_open_now !== undefined && (
              <span className="flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${store.is_open_now ? "bg-[#16A34A]" : "bg-shoppee-textSecondary"}`}
                />
                <span
                  className={`text-meta ${store.is_open_now ? "text-[#16A34A]" : "text-shoppee-textSecondary"}`}
                >
                  {store.is_open_now ? "Open Now" : "Closed"}
                </span>
              </span>
            )}
          </div>

          {/* Product count */}
          {store.product_count !== undefined && (
            <p className="mt-1 text-meta text-shoppee-textSecondary italic">
              {store.product_count} products
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
