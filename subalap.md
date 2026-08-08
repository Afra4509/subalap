# SUBALAP.md

# SUBALAP AI
## Suara Warga, Kecerdasan Kota

---

# 1. Product Soul

SUBALAP adalah platform Smart City berbasis AI yang mengubah laporan warga Surabaya menjadi informasi dan insight kota secara real-time.

SUBALAP bukan sekadar aplikasi pengaduan.

SUBALAP berfungsi sebagai:

- Mata kota melalui foto dan laporan warga
- Telinga kota melalui suara masyarakat
- Otak kota melalui analisis AI
- Pusat informasi melalui dashboard dan peta interaktif

Konsep utama:

"Warga menjadi sensor kota, AI menjadi otak yang memahami kondisi Surabaya."

---

# 2. Main User Flow

## A. Visitor Flow

Pengguna dapat mengakses website tanpa login.

Tujuan:

- Melihat kondisi Surabaya
- Melihat laporan warga
- Melihat trending issue
- Melihat peta masalah kota


Flow:

Landing Page
↓
Explore City
↓
Dashboard Publik
↓
Feed / Map / Trending / AI Insight

---

# 3. Landing Page Flow

Tujuan:

Memberikan pemahaman bahwa SUBALAP adalah pusat informasi kota Surabaya.

Isi:

## Hero Section

SUBALAP AI

"Memahami denyut Kota Surabaya melalui suara warga."

CTA:

- Lihat Kondisi Kota
- Buat Laporan


## Live City Preview

Menampilkan:

- jumlah laporan hari ini
- masalah trending
- kondisi kota


Contoh:

Surabaya Today:

🌊 24 laporan banjir

🚧 48 laporan infrastruktur

🚦 15 laporan lalu lintas

---

# 4. Citizen Report Flow

## Step 1: Warga membuat laporan

Tidak menggunakan login.

User mengisi:

- Nama
- Email
- Nomor WhatsApp (opsional)
- Kategori masalah
- Deskripsi
- Lokasi
- Foto/video


Contoh:

Kategori:

- Banjir
- Jalan Rusak
- Sampah
- Lampu Mati
- Kemacetan
- Lingkungan


---

## Step 2: AI Processing

Setelah laporan dikirim, AI melakukan analisis.

Proses:

Input:
Foto + teks + lokasi


AI melakukan:

1. Image Analysis

Mengenali objek dari foto.

Contoh:

Foto jalan berlubang.

Output:

Kategori:
Jalan Rusak


2. Text Analysis

Menganalisis isi laporan.

Output:

Masalah:
Akses jalan terganggu


3. Severity Scoring

Menghitung tingkat urgensi.

Contoh:

Severity Score:

85/100


4. Duplicate Detection

Mencari laporan serupa.

Contoh:

Ada 20 warga melaporkan masalah yang sama.

AI menggabungkan menjadi satu incident.


5. AI Summary

Membuat ringkasan.

Contoh:

"Terjadi banjir di wilayah Wonokromo yang mengganggu akses kendaraan setelah hujan deras."

---

# 5. Public Feed Flow

Setelah diverifikasi AI, laporan masuk ke feed.

Format seperti media sosial.

Contoh:

---

📍 Wonokromo, Surabaya

Banjir menghambat akses jalan utama.

Foto warga

AI Analysis:

Kategori:
Banjir

Severity:
90/100

Verification:
95%


#BanjirWonokromo


---

User dapat:

- melihat laporan
- memberikan dukungan
- komentar
- membagikan


---

# 6. Smart Map Flow

Peta menjadi pusat utama SUBALAP.

User membuka:

Map Surabaya


Menampilkan:

Marker berdasarkan kategori:

🔴 Banjir

🟠 Infrastruktur

🟡 Sampah

🔵 Event

🟣 Lingkungan


Ketika marker diklik:


Detail Incident:

Lokasi:
Wonokromo


Masalah:
Banjir


Jumlah laporan:
120


Severity:
95/100


AI Insight:

"Wilayah ini mengalami peningkatan laporan dalam 3 jam terakhir."

---

# 7. Trending Issue Flow

SUBALAP memiliki sistem trending seperti media sosial.

Tetapi trending berdasarkan dampak nyata.


AI menghitung:

Impact Score:

- jumlah laporan
- jumlah warga terdampak
- tingkat urgensi
- validitas laporan
- interaksi warga


Contoh:

🔥 Trending Surabaya


1. #BanjirWonokromo

150 laporan

Impact Score:
95


2. #JalanRusakDarmo

80 laporan

Impact Score:
76


---

# 8. AI City Assistant Flow

User dapat bertanya mengenai kondisi Surabaya.


Contoh:

User:

"Bagaimana kondisi daerah Rungkut sekarang?"


AI:

"Berdasarkan laporan warga terbaru, terdapat 15 laporan banjir ringan di sekitar Rungkut dalam 2 jam terakhir."


AI menggunakan:

- database laporan
- lokasi
- waktu
- status incident


---

# 9. Government Dashboard Flow

Dashboard khusus admin.


Admin dapat melihat:


## City Overview

Jumlah masalah aktif:

- Banjir
- Infrastruktur
- Lingkungan
- Transportasi


## Incident Monitoring

Melihat masalah berdasarkan:

- lokasi
- tingkat urgensi
- jumlah laporan


## AI Recommendation


Contoh:

"Wilayah A membutuhkan prioritas pemeriksaan drainase karena peningkatan laporan sebesar 45%."

---

# 10. Data Flow Architecture


Citizen Report

↓

Database

↓

AI Processing Layer

↓

- Classification
- Verification
- Severity Score
- Duplicate Detection

↓

City Intelligence Layer

↓

Output:

- Public Feed
- Smart Map
- Trending Issue
- Admin Dashboard


---

# 11. MVP Flow (Competition Version)

Untuk versi lomba fokus pada:


## Must Have

✅ Landing Page

✅ Citizen Report Form

✅ AI Image/Text Analysis

✅ Severity Score

✅ Smart Map

✅ Trending Issue

✅ Public Feed

✅ Simple Admin Dashboard


---

## Future Development

Versi lanjutan:

- Real-time IoT integration
- CCTV analysis
- Weather prediction
- Emergency route recommendation
- Government API integration
- Citizen reputation system


---

# Final Product Vision

SUBALAP bukan tempat warga mengeluh.

SUBALAP adalah sistem yang membuat kota mampu mendengar.

Setiap foto.
Setiap laporan.
Setiap suara warga.

Digabungkan oleh AI menjadi kecerdasan untuk Surabaya yang lebih responsif.