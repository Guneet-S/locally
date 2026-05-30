-- D2: Seed 8 test products on Test Store Patiala
-- Store ID: f2808101-1df0-44dd-b61e-c09613e0d0c9

DO $$
DECLARE
  v_store_id uuid := 'f2808101-1df0-44dd-b61e-c09613e0d0c9';
  v_pid uuid;
BEGIN

-- 1. Women's Kurti - Cotton - 160 GSM - 899
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Cotton Kurti - Block Print', 899, 2, 4, 10, 'Cotton', 160,
  ARRAY['https://image.pollinations.ai/prompt/indian+women+cotton+kurti+block+print+ethnic+fashion+product+photo+studio?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'Indigo', 'M', 10);

-- 2. Women's Kurti - Silk - 120 GSM - 1299
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Silk Kurti - Festive', 1299, 2, 4, 10, 'Silk', 120,
  ARRAY['https://image.pollinations.ai/prompt/indian+women+silk+kurti+festive+ethnic+wear+product+photo+studio+gold?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'Maroon', 'M', 10);

-- 3. Women's Kurti - Linen - 200 GSM - 1099
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Linen Kurti - Summer Breeze', 1099, 2, 4, 10, 'Linen', 200,
  ARRAY['https://image.pollinations.ai/prompt/indian+women+linen+kurti+summer+casual+ethnic+fashion+product+photo?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'Beige', 'M', 10);

-- 4. Women's Kurti Embroidered - Cotton - 160 GSM - 1499
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Embroidered Cotton Kurti', 1499, 2, 4, 10, 'Cotton', 160,
  ARRAY['https://image.pollinations.ai/prompt/indian+women+embroidered+cotton+kurti+thread+work+ethnic+fashion+product+photo?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'White', 'L', 10);

-- 5. Men's T-shirt - Cotton - 180 GSM - 499
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Cotton Crew Neck T-Shirt', 499, 1, 1, 1, 'Cotton', 180,
  ARRAY['https://image.pollinations.ai/prompt/men+cotton+crew+neck+tshirt+plain+streetwear+product+photo+studio?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'Black', 'M', 10);

-- 6. Men's T-shirt - Polyester - 140 GSM - 399
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Polyester Active T-Shirt', 399, 1, 1, 1, 'Polyester', 140,
  ARRAY['https://image.pollinations.ai/prompt/men+polyester+active+sport+tshirt+drifit+gym+product+photo?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'Navy', 'M', 10);

-- 7. Oversized Hoodie - Polyester (fleece-style) - 280 GSM - 1299
-- Note: fabric constraint limits to Cotton/Cotton Blend/Polyester/Rayon/Linen/Denim/Silk
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Oversized Fleece Hoodie', 1299, 1, 3, 8, 'Polyester', 280,
  ARRAY['https://image.pollinations.ai/prompt/oversized+fleece+hoodie+streetwear+heavy+weight+product+photo+studio?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'Charcoal', 'L', 10);

-- 8. Oversized Hoodie - Cotton Blend - 260 GSM - 999
INSERT INTO public.products (store_id, name, price, gender_id, category_id, type_id, fabric, gsm, photo_urls, status)
VALUES (v_store_id, 'Oversized Cotton-Blend Hoodie', 999, 1, 3, 8, 'Cotton Blend', 260,
  ARRAY['https://image.pollinations.ai/prompt/oversized+cotton+blend+hoodie+casual+lifestyle+product+photo+studio?width=600&height=600&nologo=true'],
  'active') RETURNING id INTO v_pid;
INSERT INTO public.product_variants (product_id, color, size, qty) VALUES (v_pid, 'Beige', 'L', 10);

END $$;
