# NUSA POS 2.0 — Starter Frontend Admin

Starter web React + Vite + Supabase untuk Kopi Nusa. **Belum siap transaksi produksi.**

## Yang sudah berfungsi
- Login email/password Supabase Auth.
- Membaca profil, membership, dan pemilihan outlet yang diizinkan.
- Menampilkan master produk, kategori, status, dan harga Booth/Online.
- Pencarian produk, filter menu/addon, dan edit harga dengan RPC `set_product_price` yang dibuat pada Tahap 04G-5A.
- Layout responsif Admin dengan sidebar untuk modul-modul yang akan dibangun.

## Yang belum ada
- CRUD produk/kategori, upload foto, resep, stok masuk lewat UI, kasir, addon checkout, pembukuan, dan laporan sungguhan.
- Menu yang belum dibangun sengaja **nonaktif**.

## Persiapan Supabase
1. **Gunakan project NUSA POS, bukan Aurora Digital.**
2. Pastikan semua SQL fondasi yang sudah dikerjakan berhasil, khususnya tabel `profiles`, `outlet_memberships`, `products`, `product_prices`, serta RPC `set_product_price`.
3. Di Supabase Authentication > Users buat user, lalu pastikan profil dan membership outlet `KN-001` sudah dihubungkan seperti SQL Tahap 01C.
4. Ambil Project URL dan **publishable key** (atau legacy anon key) dari Supabase project Settings > API Keys. **JANGAN gunakan service_role atau secret key di frontend.**

## Jalankan lokal (Windows)
1. Instal Node.js LTS dari https://nodejs.org/ jika belum ada.
2. Buka folder project di VS Code atau terminal.
3. Salin `.env.example` menjadi `.env` dan isi:

   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

4. Jalankan `npm install`, lalu `npm run dev`. Buka alamat localhost yang tampil.

## Upload ke GitHub dan Vercel
1. Upload **isi folder project** ke repository GitHub baru `nusa-pos-2` (jangan sertakan `.env`).
2. Di Vercel: Add New > Project > Import Git Repository, pilih repository tersebut.
3. Framework: Vite; Build command: `npm run build`; Output directory: `dist`.
4. Di Vercel > Settings > Environment Variables isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`, lalu deploy/redeploy.
5. Supabase > Authentication > URL Configuration: sesuaikan Site URL/Redirect URLs saat menambahkan alur email link/password recovery di tahap berikutnya.

## Batasan keamanan
- App memakai Row Level Security yang sudah ditetapkan di Supabase, bukan mengandalkan penyembunyian tombol saja.
- Publikasi starter bukan berarti checkout siap: fungsi checkout lama sebelumnya dibekukan. Jangan aktifkan kembali sebelum pengujian.
- Edit Booth dan Online mengirim dua permintaan RPC terpisah. Bila salah satu gagal, harga pertama mungkin sudah tersimpan; error ditampilkan dan data dimuat ulang. Kelak kita sediakan fungsi edit harga berpasangan secara atomik.
- Perlu review menyeluruh RLS, hak akses role manager, audit mutasi dan replay request sebelum produksi.
