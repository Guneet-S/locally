import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Link from "next/link";
import { Package } from "lucide-react";
import DeleteProductButton from "@/components/shopper/DeleteProductButton";

type InventoryRow = {
  id: string;
  name: string;
  price: number;
  photo_urls: string[];
  status: string;
  created_at: string;
  product_types: { name: string } | null;
  product_variants: { qty: number }[];
};

type SearchParams = {
  q?: string;
  gender?: string;
  category?: string;
  stock?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 20;

function stockBadge(totalQty: number) {
  if (totalQty === 0) {
    return { label: "Out of Stock", color: "bg-[#DC2626] text-white" };
  }
  if (totalQty <= 5) {
    return { label: "Low Stock", color: "bg-[#F59E0B] text-white" };
  }
  return { label: "In Stock", color: "bg-[#16A34A] text-white" };
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!store) redirect("/setup");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const search = searchParams.q?.trim() ?? "";
  const sort = searchParams.sort ?? "newest";

  let query = supabase
    .from("products")
    .select(
      "id, name, price, photo_urls, status, created_at, product_types(name), product_variants(qty)",
      { count: "exact" }
    )
    .eq("store_id", store.id);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (searchParams.gender) {
    const genderId = parseInt(searchParams.gender, 10);
    if (Number.isFinite(genderId)) query = query.eq("gender_id", genderId);
  }
  if (searchParams.category) {
    const catId = parseInt(searchParams.category, 10);
    if (Number.isFinite(catId)) query = query.eq("category_id", catId);
  }

  // Sort
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    // For most_viewed and low_stock we still server-fetch newest first then
    // re-sort client-side on the visible page (a full join+aggregate would
    // need a DB view; deferred to v2.1).
    query = query.order("created_at", { ascending: false });
  }

  const { data, count } = await query.range(offset, offset + PAGE_SIZE - 1);
  const rows: InventoryRow[] = (data as InventoryRow[] | null) ?? [];

  // Compute total qty per product, apply stock filter
  const withQty = rows.map((r) => ({
    ...r,
    totalQty: r.product_variants.reduce((sum, v) => sum + v.qty, 0),
  }));

  let filtered = withQty;
  if (searchParams.stock === "in") {
    filtered = withQty.filter((r) => r.totalQty > 5);
  } else if (searchParams.stock === "low") {
    filtered = withQty.filter((r) => r.totalQty >= 1 && r.totalQty <= 5);
  } else if (searchParams.stock === "out") {
    filtered = withQty.filter((r) => r.totalQty === 0);
  }

  if (sort === "low_stock") {
    filtered = [...filtered].sort((a, b) => a.totalQty - b.totalQty);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Build URL helper
  const buildHref = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides } as Record<
      string,
      string | undefined
    >;
    for (const [k, v] of Object.entries(merged)) {
      if (v != null && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/inventory?${qs}` : "/inventory";
  };

  return (
    <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24 pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-text-primary">Inventory</h1>
        <Link
          href="/inventory/new"
          className="rounded-[10px] bg-shopper-primary px-4 py-2 text-button text-white"
        >
          Add +
        </Link>
      </div>

      {/* Search */}
      <form action="/inventory" method="GET" className="mt-4">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search products by name"
          className="w-full rounded-[10px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
        />
      </form>

      {/* Stock filters */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "", label: "All stock" },
          { value: "in", label: "In stock" },
          { value: "low", label: "Low stock" },
          { value: "out", label: "Out of stock" },
        ].map(({ value, label }) => {
          const active = (searchParams.stock ?? "") === value;
          return (
            <Link
              key={label}
              href={buildHref({ stock: value || undefined, page: "1" })}
              className={`shrink-0 rounded-full border-[0.5px] px-3 py-1 text-meta ${
                active
                  ? "border-shopper-primary bg-shopper-primary text-white"
                  : "border-border-subtle bg-surface-muted text-text-secondary"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Sort */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-meta text-text-tertiary">Sort:</span>
        {[
          { value: "newest", label: "Newest" },
          { value: "low_stock", label: "Low stock first" },
        ].map(({ value, label }) => {
          const active = sort === value;
          return (
            <Link
              key={value}
              href={buildHref({ sort: value, page: "1" })}
              className={`rounded-full border-[0.5px] px-2.5 py-0.5 text-meta ${
                active
                  ? "border-shopper-primary text-shopper-primary"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {filtered.map((product) => {
            const badge = stockBadge(product.totalQty);
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-3"
              >
                {product.photo_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.photo_urls[0]}
                    alt={product.name}
                    className="h-14 w-14 rounded-[8px] object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-[8px] bg-surface-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-h3 text-text-primary">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-meta text-text-secondary">
                    &#8377;{product.price}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {product.product_types?.name && (
                      <span className="text-meta text-text-tertiary">
                        {product.product_types.name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${badge.color}`}
                    >
                      {badge.label} · {product.totalQty}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/inventory/${product.id}/edit`}
                    className="text-meta text-shopper-primary"
                  >
                    Edit
                  </Link>
                  <DeleteProductButton productId={product.id} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center text-center">
          <Package size={40} strokeWidth={1.5} className="text-surface-dim" />
          <p className="mt-3 text-h3 text-text-primary">No products yet</p>
          <p className="mt-1 text-body text-text-secondary">
            Start building your catalogue.
          </p>
          <Link
            href="/inventory/new"
            className="mt-6 rounded-[10px] bg-shopper-primary px-6 py-3 text-button text-white"
          >
            Add your first item
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Link
            href={buildHref({ page: String(Math.max(1, page - 1)) })}
            className={`text-meta ${
              page === 1
                ? "pointer-events-none text-text-tertiary"
                : "text-shopper-primary"
            }`}
          >
            ‹ Prev
          </Link>
          <span className="text-meta text-text-tertiary">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
            className={`text-meta ${
              page === totalPages
                ? "pointer-events-none text-text-tertiary"
                : "text-shopper-primary"
            }`}
          >
            Next ›
          </Link>
        </div>
      )}
    </div>
  );
}
