# NUSA POS 2.0 Admin v0.4.1 — Foto Produk

Update dari v0.4.0. Dashboard, menu, inventory, kasir (mode persiapan), dan modul lain tetap ada.

## Upload ke GitHub

Unggah **isi folder ini ke root repository**, bukan folder pembungkus. File yang berubah: `src/main.jsx`, `src/style.css`, `package.json`. File lain ikut disertakan untuk memudahkan penggantian total. Pastikan Anda memperbarui file lama, bukan menambahkan duplikat pada folder lain. Setelah commit, periksa deployment Vercel terbaru.

## Setup Storage Supabase (SATU KALI)

Buka Supabase project NUSA POS 2.0 > SQL Editor; jalankan `supabase/setup_product_images.sql` sekali. Fungsi foto butuh Storage bucket `product-images`, format JPG/PNG/WebP, maksimum 5 MB, dan policy yang membatasi upload berdasarkan role Owner/Admin bisnis. Jangan menjalankannya di project Aurora Digital.

## Cara kerja

Menu Produk > Edit > pilih JPG/PNG/WebP **persegi tepat 1:1**, maksimal 5 MB > Simpan Harga & Foto. File disimpan dalam bucket `product-images`, path disimpan pada kolom `products.image_path` yang **sudah ada** pada skema NUSA POS (tidak memerlukan kolom image_url baru).

Frontend tidak memakai service_role key. Upload dan edit memerlukan login dan keanggotaan Owner/Admin bisnis sesuai policy. Harga Manager masih bisa diedit bila mendapat akses seperti sebelumnya; upload foto lebih ketat (Owner/Admin). Bila Anda ingin Manager juga boleh upload, sesuaikan policy Storage dengan otorisasi yang sama setelah audit.

Catatan: ini memperbarui **foto menu**, bukan menyelesaikan checkout produksi. Bila simpan harga sukses tetapi upload foto gagal, harga mungkin sudah berubah; halaman menampilkan error untuk ditindaklanjuti.
