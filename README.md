# NUSA POS 2.0 v0.5.0 - Paket katalog & manajemen kasir

Pembaruan dari v0.4.1. Menjaga Dashboard, Menu Produk, Inventory, Kasir, Pembukuan, Laporan.

## Yang siap diuji

1. **Foto produk di kedua kasir**: `products.image_path` dari `product-images` (1:1, 5 MB ketika upload melalui Menu Produk).
2. **Tambah Menu**: tombol di Menu Produk, SKU/nama/harga Booth/Online/foto; memerlukan SQL `supabase/setup_v050.sql`.
3. **Undang akun kasir**: Manajemen Tim, nama + email. Memerlukan Edge Function `supabase/functions/nusa-invite-cashier/index.ts` dideploy. Kasir menerima email dan mengatur password sebelum login di halaman login biasa.
4. **Pengaturan QRIS statis dan bank**: form Pengaturan; memerlukan SQL `supabase/setup_v050.sql`.
5. **Ekspor CSV laporan penjualan**: sampai 1.000 transaksi terbaru per outlet (bukan backup database lengkap).

## Urutan pemasangan (satu kali setup backend, satu kali upload frontend)

1. **Backup repository GitHub** saat ini terlebih dahulu.
2. Supabase Dashboard -> SQL Editor -> jalankan `supabase/setup_v050.sql` (sesuai project NUSA POS, bukan Aurora Digital). Pastikan hasil `Success`. `setup_product_images.sql` dari v0.4.1 tetap dibutuhkan.
3. **Deploy Edge Function** `nusa-invite-cashier` dengan source `supabase/functions/nusa-invite-cashier/index.ts` melalui Supabase Edge Functions. Pastikan JWT verification aktif; jangan matikan pemeriksaan JWT.
4. Di GitHub repository **yang sama**, unggah **isi ZIP ke root**, overwrite `src/main.jsx`, `src/modules.jsx`, `src/style.css`, `README.md`, `package.json` dan file lainnya. Jangan membuat folder bertingkat baru. Pastikan versi footer jadi `0.5.0`.
5. Cek Vercel Deployments -> Ready; buka Menu Produk dan coba **Tambah Menu** dengan SKU uji (hindari penggunaan stok atau transaksi nyata selama tes). Login kasir melalui email undangan.

## Status integrasi dan keamanan penting

- **Checkout Booth dan Online BELUM diaktifkan untuk transaksi uang sungguhan.** Fungsi checkout sebelumnya sengaja direvoke; diperlukan inspeksi SQL `sales`, `sale_items`, `sale_payments`, add-on, stok, resep, idempotency dan tes transaksi end-to-end sebelum aman untuk membuka izin.
- **Pembukuan double-entry BELUM diaktifkan** karena ledger dan pemetaan akun belum tersedia. Jangan memakai data settlement sebagai jurnal keuangan otomatis.
- Pengaturan QRIS **hanya menampilkan atau menyimpan URL QRIS statis**; tidak memverifikasi pembayaran bank.
- Fitur **backup yang disediakan berupa ekspor CSV 1.000 penjualan terbaru**, bukan backup penuh/restore otomatis.
- **Audit & perubahan role kasir lengkap BELUM siap**. Undangan kasir tersedia, tetapi suspend/ubah role serta audit akses masih membutuhkan alur tersendiri.
- Agar foto muncul, gunakan **Public Bucket** `product-images` dari setup v0.4.1 dan URL harus bisa dibaca dari browser.
- Setelah membuat menu baru, resep dan HPP **belum otomatis terisi**. Atur resep dulu sebelum transaksi riil diaktifkan.

## Catatan pengujian

Paket belum diverifikasi melalui build Vite lengkap karena instalasi npm terhalang lingkungan. Cek build Vercel setelah commit. Jangan menganggap fitur pembayaran siap sebelum pengujian backend.
