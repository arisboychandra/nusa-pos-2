-- NUSA POS v0.5.0 | Jalankan setelah setup_product_images.sql sebelumnya.
-- Semua fungsi berikut memerlukan peran Owner/Admin aktif.
BEGIN;

CREATE OR REPLACE FUNCTION public.nusa_create_product(
 p_outlet_id uuid, p_sku text, p_name text, p_booth_price numeric, p_online_price numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_business uuid; v_product uuid; v_type text; v_category uuid;
BEGIN
 SELECT business_id INTO v_business FROM public.outlets WHERE id=p_outlet_id AND is_active LIMIT 1;
 IF v_business IS NULL OR NOT public.can_manage_catalog(v_business) OR NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active
 ) THEN RAISE EXCEPTION 'Tidak memiliki akses untuk menambah produk'; END IF;
 IF p_sku IS NULL OR p_sku !~ '^[A-Z0-9][A-Z0-9_-]{1,39}$' OR length(trim(p_name))<2 OR length(p_name)>120 THEN
  RAISE EXCEPTION 'SKU atau nama tidak valid'; END IF;
 IF p_booth_price IS NULL OR p_online_price IS NULL OR p_booth_price<0 OR p_online_price<0
 OR p_booth_price>999999999 OR p_online_price>999999999 OR p_booth_price<>trunc(p_booth_price) OR p_online_price<>trunc(p_online_price) THEN
  RAISE EXCEPTION 'Harga tidak valid'; END IF;
 IF EXISTS (SELECT 1 FROM public.products WHERE business_id=v_business AND sku=p_sku) THEN
  RAISE EXCEPTION 'Kode SKU sudah digunakan'; END IF;
 -- Gunakan jenis produk dan kategori menu utama yang SUDAH ADA, agar sesuai constraint katalog eksisting.
 SELECT product_type,category_id INTO v_type,v_category FROM public.products
 WHERE business_id=v_business AND product_type<>'addon' ORDER BY name LIMIT 1;
 IF v_type IS NULL THEN RAISE EXCEPTION 'Belum ada template menu utama pada bisnis'; END IF;
 INSERT INTO public.products (business_id,sku,name,product_type,category_id,is_active)
 VALUES (v_business,p_sku,trim(p_name),v_type,v_category,true)
 RETURNING id INTO v_product;
 -- Transaksi database atomic: jika ada kegagalan harga, produk baru otomatis rollback.
 PERFORM public.set_product_price(p_outlet_id,p_sku,'BOOTH',p_booth_price);
 PERFORM public.set_product_price(p_outlet_id,p_sku,'ONLINE',p_online_price);
 RETURN v_product;
END $$;
REVOKE ALL ON FUNCTION public.nusa_create_product(uuid,text,text,numeric,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nusa_create_product(uuid,text,text,numeric,numeric) TO authenticated;

CREATE TABLE IF NOT EXISTS public.nusa_outlet_settings (
 outlet_id uuid PRIMARY KEY REFERENCES public.outlets(id) ON DELETE CASCADE,
 qris_image_url text,
 bank_name text,
 bank_account text,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT nusa_qris_url_valid CHECK(qris_image_url IS NULL OR (length(qris_image_url)<=2048 AND qris_image_url LIKE 'https://%'))
);
ALTER TABLE public.nusa_outlet_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nusa_settings_read ON public.nusa_outlet_settings;
CREATE POLICY nusa_settings_read ON public.nusa_outlet_settings FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.outlet_memberships m JOIN public.profiles p ON p.id=m.user_id
 WHERE m.outlet_id=nusa_outlet_settings.outlet_id AND m.user_id=auth.uid() AND m.is_active AND p.is_active)
);
DROP POLICY IF EXISTS nusa_settings_insert ON public.nusa_outlet_settings;
CREATE POLICY nusa_settings_insert ON public.nusa_outlet_settings FOR INSERT TO authenticated WITH CHECK (
 EXISTS (SELECT 1 FROM public.outlet_memberships m JOIN public.profiles p ON p.id=m.user_id
 WHERE m.outlet_id=nusa_outlet_settings.outlet_id AND m.user_id=auth.uid() AND m.is_active AND m.role IN ('owner','admin') AND p.is_active)
);
DROP POLICY IF EXISTS nusa_settings_update ON public.nusa_outlet_settings;
CREATE POLICY nusa_settings_update ON public.nusa_outlet_settings FOR UPDATE TO authenticated USING (
 EXISTS (SELECT 1 FROM public.outlet_memberships m JOIN public.profiles p ON p.id=m.user_id
 WHERE m.outlet_id=nusa_outlet_settings.outlet_id AND m.user_id=auth.uid() AND m.is_active AND m.role IN ('owner','admin') AND p.is_active)
) WITH CHECK (
 EXISTS (SELECT 1 FROM public.outlet_memberships m JOIN public.profiles p ON p.id=m.user_id
 WHERE m.outlet_id=nusa_outlet_settings.outlet_id AND m.user_id=auth.uid() AND m.is_active AND m.role IN ('owner','admin') AND p.is_active)
);
COMMIT;
