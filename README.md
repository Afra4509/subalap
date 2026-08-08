# SUBALAP

Platform laporan warga dan intelligence kota untuk Surabaya. Dibangun dengan Next.js 16,
React 19, Neon PostgreSQL, Leaflet, dan OpenStreetMap.

## Jalankan lokal

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:3000`. Tanpa `DATABASE_URL`, aplikasi memakai 16 laporan
terintegrasi terverifikasi dari folder `data asli`. Laporan baru tetap terlihat di feed,
tetapi hanya tersimpan di `localStorage` perangkat sampai database dihubungkan.

## Sumber data

`data asli/dataset_isu_surabaya_3_bulan_terverifikasi_2026-07-27.json` menjadi sumber
bawaan untuk feed, peta, trending, dashboard, asisten, dan halaman `/data`. Dataset berisi
16 catatan kanonis, 62 titik lokasi, status verifikasi, catatan akurasi, dan tautan sumber.
Laporan terintegrasi selalu dibedakan dari laporan warga agar asal informasi tidak rancu.

## Database

1. Buat database PostgreSQL/Neon.
2. Jalankan [`database/schema.sql`](database/schema.sql).
3. Salin `.env.example` menjadi `.env.local`.
4. Isi `DATABASE_URL` dan `NEXT_PUBLIC_SITE_URL`.

## Validasi

```bash
pnpm check
pnpm build
```

## Peta

Peta memakai Leaflet dan tile publik OpenStreetMap. Tampilan dikunci pada batas
Surabaya, tidak memperpanjang halaman, dan hanya memuat insiden di dalam geofence kota.
Attribution wajib tetap terlihat.
Tile publik bersifat best-effort; untuk trafik produksi tinggi gunakan penyedia tile
ber-SLA atau self-host.

## Laporan warga

Halaman `/report` menyediakan akses kamera perangkat dan upload foto. Foto dikompresi
di browser sebelum dikirim. GPS diverifikasi dengan geofence Surabaya pada client dan
server; lokasi di luar kota ditolak. Analisis awal membedakan keadaan aktif, membaik,
atau dilaporkan pulih serta memberi saran tindak lanjut.
