# NUSA POS 2.0 — Admin v0.2.0

Frontend React + Vite + Supabase untuk Kopi Nusa.

## Perubahan v0.2.0
- Dashboard Admin aktif, delapan kartu keuangan, grafik omzet harian, filter 7 hari / bulan / tahun / rentang tanggal, selector outlet multi-outlet.
- Menampilkan **data aktual dari Supabase** `sales` dan `sale_payments` untuk transaksi `completed` pada periode terpilih; tidak ada data contoh atau omzet POSe yang dibuat-buat.
- **Pengeluaran** dan **Estimasi Laba Operasional** tampil *Belum tersedia* sampai tabel Pembukuan dan pengeluaran final dibuat.
- Menu Produk, login Supabase, pemilihan outlet, edit harga dan RLS dipertahankan.
- Modul kasir tetap nonaktif karena checkout terpadu, resep, dan stok belum siap produksi.

## Mengunggah ke GitHub melalui browser
1. Buka repositori GitHub `nusa-pos-2`.
2. Ubah/unggah berkas dari ZIP ini ke **root** repositori (`package.json` harus berada di root), bukan ke subfolder baru.
3. Commit ke branch `main`. Vercel yang terhubung ke repositori akan deploy secara otomatis.
4. Jangan mengganti project Vercel/Supabase dan jangan mengunggah `.env` lokal.

## Environment Variables (sudah ada di Vercel)
- `VITE_SUPABASE_URL` — URL root project Supabase (`https://....supabase.co`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — publishable key `sb_publishable_...`

Jangan menaruh service role key, secret key, atau password database ke frontend.

## Pengembangan lokal opsional
```
npm install
npm run dev
npm run build
```

## Batasan akuntansi
- Dashboard `Total Omzet`: total `sales.total_amount` status `completed` termasuk transaksi Online yang belum settlement. Settlement tidak ditambahkan lagi ke omzet.
- `Cash Booth` dan `QRIS Booth`: jumlah `sale_payments.amount` yang terkonfirmasi untuk sales Booth pada periode terkait.
- `Total HPP`: snapshot `sales.total_hpp`. Nilai ini bisa belum representatif apabila resep dan inventory belum lengkap.
- `Laba Kotor`: Omzet dikurangi HPP; belum mengurangi komisi platform/biaya lainnya.
- Transaksi void tidak dihitung. Riwayat POSe belum termasuk sebelum migrasi dilakukan.
- Rentang sangat besar dibatasi sampai 10.000 transaksi per pemuatan, dengan peringatan bila terlampaui. Grafik harian dibatasi 366 hari.

## Catatan keamanan
Pemeriksaan Supabase RLS dan pengujian checkout tetap diperlukan sebelum transaksi produksi. Dashboard adalah tampilan baca-saja dan tidak memodifikasi data transaksi.
