-- Collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  cover_image_url text,
  description text,
  is_featured boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

-- Collection-products junction
CREATE TABLE IF NOT EXISTS public.collection_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, product_id)
);

-- Index for New Arrivals queries
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products (created_at DESC);

-- RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if rerunning
DROP POLICY IF EXISTS "public_read_collections" ON public.collections;
DROP POLICY IF EXISTS "owner_write_collections" ON public.collections;
DROP POLICY IF EXISTS "public_read_collection_products" ON public.collection_products;
DROP POLICY IF EXISTS "owner_write_collection_products" ON public.collection_products;

-- Collections: public read; store owner writes
CREATE POLICY "public_read_collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "owner_write_collections" ON public.collections FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Junction: public read; inherit from collection owner
CREATE POLICY "public_read_collection_products" ON public.collection_products FOR SELECT USING (true);
CREATE POLICY "owner_write_collection_products" ON public.collection_products FOR ALL
  USING (collection_id IN (
    SELECT c.id FROM public.collections c
    JOIN public.stores s ON s.id = c.store_id
    WHERE s.owner_id = auth.uid()
  ))
  WITH CHECK (collection_id IN (
    SELECT c.id FROM public.collections c
    JOIN public.stores s ON s.id = c.store_id
    WHERE s.owner_id = auth.uid()
  ));

-- trending_stores function
CREATE OR REPLACE FUNCTION public.trending_stores(limit_n int DEFAULT 10)
RETURNS TABLE(store_id uuid, score bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    s.id AS store_id,
    COALESCE(v.views_7d, 0) * 1
    + COALESCE(w.wishlist_adds_7d, 0) * 3
    + COALESCE(ce.profile_opens_7d, 0) * 2 AS score
  FROM public.stores s
  LEFT JOIN (
    SELECT sv.store_id, COUNT(*) AS views_7d
    FROM public.store_views sv
    WHERE sv.viewed_at >= now() - interval '7 days'
    GROUP BY sv.store_id
  ) v ON v.store_id = s.id
  LEFT JOIN (
    SELECT sw.store_id, COUNT(*) AS wishlist_adds_7d
    FROM public.store_wishlists sw
    WHERE sw.created_at >= now() - interval '7 days'
    GROUP BY sw.store_id
  ) w ON w.store_id = s.id
  LEFT JOIN (
    SELECT ce.store_id, COUNT(*) AS profile_opens_7d
    FROM public.contact_events ce
    WHERE ce.created_at >= now() - interval '7 days'
    GROUP BY ce.store_id
  ) ce ON ce.store_id = s.id
  WHERE s.is_active = true
  ORDER BY score DESC
  LIMIT limit_n;
$$;

-- recently_updated_stores function
CREATE OR REPLACE FUNCTION public.recently_updated_stores(limit_n int DEFAULT 10)
RETURNS TABLE(store_id uuid, last_product_added_at timestamptz)
LANGUAGE sql STABLE AS $$
  SELECT p.store_id, MAX(p.created_at) AS last_product_added_at
  FROM public.products p
  JOIN public.stores s ON s.id = p.store_id
  WHERE p.status = 'active'
    AND s.is_active = true
    AND p.created_at >= now() - interval '14 days'
  GROUP BY p.store_id
  ORDER BY last_product_added_at DESC
  LIMIT limit_n;
$$;
