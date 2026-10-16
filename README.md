# NUSA POS 2.0 Admin v0.4.0 (integrated navigation)

Paket ini berbasis pada ZIP v0.2.0 yang diunggah pengguna. Tidak membuat Supabase project atau lingkungan baru.

## Deploy

1. Backup atau download repository GitHub saat ini.
2. Salin **isi** ZIP ini ke root repository GitHub `nusa-pos-2` (bukan membuat subfolder). Terutama pastikan `src/main.jsx`, `src/modules.jsx`, dan `src/style.css` terganti/ditambahkan.
3. Commit ke `main`; Vercel akan membangun ulang.
4. Konfigurasi Vercel Production yang sudah ada dipertahankan: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Periksa build Vercel sebelum mengarahkan transaksi apa pun ke aplikasi.

## Modul

- Dashboard: angka dan grafik dari tabel `sales` dan `sale_payments`.
- Menu Produk: katalog dan perubahan harga via `set_product_price`.
- Inventory: saldo, stok masuk via `receive_inventory`, mutasi, resep draft via `create_recipe_draft`/`save_recipe_material`, aktivasi via `activate_recipe_version`.
- Kasir Booth/Online: katalog dan keranjang nyata; **checkout tetap nonaktif** karena fungsi transaksi terpadu dan addon belum diaudit.
- Laporan: daftar transaksi, rekap harian, ringkasan omzet/HPP, riwayat shift (dibatasi 500 transaksi terakhir, bukan laporan penuh).
- Manajemen Tim: pembacaan membership saja.
- Pembukuan: tampilan modul dan pemberitahuan status; **belum ada jurnal seimbang/RPC posting**, tidak menerima transaksi keuangan.
- Pengaturan: informasi outlet baca saja.
- Shift: modul `ShiftModule` tersedia, tetapi belum dihubungkan ke navigasi; penutupan shift tidak disarankan sebelum checkout terpadu selesai.

## Peringatan

Ini **bukan aplikasi POS siap transaksi produksi**. Jangan mengaktifkan fungsi checkout lama atau mengasumsikan Pengeluaran/Pembukuan sudah tersedia. Tidak ada data historis POSe diimpor oleh paket ini. Perubahan pada Supabase bergantung pada SQL tahap sebelumnya yang telah berhasil dijalankan.

## Build

`npm install` lalu `npm run build`. Build lokal tidak dapat diverifikasi di sesi pembuatan paket akibat pemasangan dependency yang time out. Pantau Build Logs Vercel setelah upload dan kirim error jika ada.
