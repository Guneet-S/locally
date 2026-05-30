import Link from "next/link";
import ProductWishlistHeart from "@/components/shoppee/ProductWishlistHeart";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number | null;
    photo_urls: string[];
    fabric?: string | null;
    gsm?: number | null;
    gender?: { name: string } | null;
    genders?: { name: string } | null;
    product_types?: { name: string } | null;
    product_variants?: { qty: number }[];
  };
  wishlisted?: boolean;
  userId?: string | null;
}

function getStockInfo(variants: { qty: number }[] | undefined) {
  if (!variants || variants.length === 0) return null;
  const total = variants.reduce((sum, v) => sum + v.qty, 0);
  if (total === 0) return { label: "Out of Stock", color: "text-[#DC2626]" };
  if (total <= 5) return { label: "Low Stock", color: "text-[#F59E0B]" };
  return { label: "In Stock", color: "text-[#16A34A]" };
}

export default function ProductCard({
  product,
  wishlisted = false,
  userId,
}: ProductCardProps) {
  const stockInfo = getStockInfo(product.product_variants);
  const genderName =
    (product.gender?.name ?? product.genders?.name) || null;
  const typeName = product.product_types?.name ?? null;

  return (
    <div className="relative">
      <Link href={`/product/${product.id}`} className="block">
        <div className="overflow-hidden rounded-[10px] border border-shoppee-border bg-white shadow-sm">
          {/* Square image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-t-[10px]">
            {product.photo_urls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.photo_urls[0]}
                alt={product.name}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="aspect-square w-full bg-shoppee-muted" />
            )}
          </div>

          <div className="p-2">
            <p className="font-serif text-sm line-clamp-2 text-shoppee-textPrimary mt-1">
              {product.name}
            </p>

            {/* GSM badge */}
            {product.gsm && (
              <span className="mt-1 inline-block text-meta bg-shoppee-muted text-shoppee-primary px-1.5 py-0.5 rounded">
                {product.gsm} GSM
              </span>
            )}

            {/* Fabric */}
            {product.fabric && (
              <p className="mt-0.5 text-meta text-shoppee-textSecondary">
                {product.fabric}
              </p>
            )}

            {/* Price */}
            <p className="mt-1">
              {product.price !== null ? (
                <span className="font-semibold text-shoppee-primary text-sm">
                  Rs. {product.price.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-meta text-shoppee-textSecondary italic">
                  Price on visit
                </span>
              )}
            </p>

            {/* Gender + type */}
            {genderName && typeName && (
              <p className="mt-0.5 text-meta text-shoppee-textSecondary">
                {genderName}&apos;s {typeName}
              </p>
            )}

            {/* Stock badge */}
            {stockInfo && (
              <p className={`mt-1 text-meta font-medium ${stockInfo.color}`}>
                {stockInfo.label}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Heart — only if userId present */}
      {userId && (
        <ProductWishlistHeart
          productId={product.id}
          initialWishlisted={wishlisted}
        />
      )}
    </div>
  );
}
