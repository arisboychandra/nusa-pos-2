-- NUSA POS 2.0: Setup foto produk satu kali
-- Menggunakan kolom products.image_path yang sudah ada.
-- Storage bucket publik untuk DISPLAY gambar produk; upload dibatasi.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Hanya owner/admin aktif bisnis bersangkutan yang boleh upload.
-- Path: BUSINESS_UUID/PRODUCT_UUID/FILE_UUID.jpg
-- Memeriksa kedua ID benar-benar terkait; tidak mengizinkan namespace milik bisnis lain.
drop policy if exists "nusa_product_images_insert" on storage.objects;
create policy "nusa_product_images_insert" on storage.objects
for insert to authenticated
with check (
 bucket_id = 'product-images'
 and exists (
   select 1 from public.products p
   where p.id::text = (storage.foldername(name))[2]
     and p.business_id::text = (storage.foldername(name))[1]
     and public.can_manage_catalog(p.business_id)
     and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_active)
 )
);
-- Tidak ada UPDATE atau DELETE langsung dari browser untuk menjaga jejak foto lama.
-- Public bucket menyediakan akses lihat URL; tidak memerlukan policy SELECT eksplisit untuk menampilkan foto.
