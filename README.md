# KlinikHub — Fondasi Aplikasi

Fondasi awal (monolith Next.js) untuk platform KlinikHub, dibangun sebelum dipecah menjadi
microservices sesuai [`TECH-ARCHITECTURE-KlinikHub.md`](./TECH-ARCHITECTURE-KlinikHub.md).

## Fitur yang sudah ada

- **Autentikasi + OTP email** — register, login, verifikasi OTP, lupa/reset password (kode OTP dikirim via Gmail SMTP)
- **Manajemen User (CRUD penuh)** — tambah/edit/nonaktifkan/hapus staf, atur role, upload foto
- **Site Settings (fully customizable)** — nama situs, tagline, logo, favicon, gambar hero, warna tema, font, kontak, sosial media, mode maintenance — semua tersimpan di DB dan langsung dipakai landing page
- **Upload gambar → base64** — semua gambar (foto profil, logo, favicon, hero) disimpan sebagai base64 data URL langsung di dokumen MongoDB (maks 2MB per gambar), tanpa perlu storage eksternal
- **Palet warna & font sudah terpasang**: `#F5F5F5 / #B9E937 / #57D131 / #406661` + font **Fredoka**

## Setup

```bash
# 1. Install dependency
npm install

# 2. Salin & isi environment variable
cp .env.example .env.local
# isi MONGODB_URI, GMAIL_USER, GMAIL_APP_PASSWORD, JWT_SECRET (lihat komentar di .env.example)

# 3. Seed akun admin pertama (role OWNER)
npm run seed

# 4. Jalankan development server
npm run dev
```

Buka http://localhost:3000 — login dengan akun admin hasil seed di `/login`, lalu kelola user &
site settings di `/admin`.

## Catatan penting soal Gmail SMTP

Gunakan **App Password**, bukan password akun Google biasa:
1. Aktifkan 2-Step Verification di akun Google pengirim
2. Buat App Password di https://myaccount.google.com/apppasswords
3. Isi `GMAIL_USER` (email pengirim) dan `GMAIL_APP_PASSWORD` (16 digit tanpa spasi) di `.env.local`

## Struktur

```
app/
  page.tsx              # landing page, konten dari Site Settings
  login, register, verify-otp, forgot-password, reset-password/
  admin/                # dashboard, users, settings (butuh login)
  api/
    auth/                # register, login, verify-otp, resend-otp, forgot/reset-password, me, logout
    admin/users/         # CRUD user (list+create, get/update/delete by id)
    settings/            # GET publik, PUT admin-only
lib/                     # db, mailer, jwt, auth (session), otp, response, image (validasi base64)
models/                  # User, Otp, SiteSettings (Mongoose)
scripts/seed.ts          # buat akun OWNER pertama
proxy.ts                 # proteksi route /admin/* (Next 16 "proxy", pengganti middleware)
```

## Selanjutnya (belum dikerjakan)

Modul dari PRD yang belum diimplementasikan di fondasi ini: RME/SOAP, farmasi & stok,
kasir/invoice, integrasi SATUSEHAT/BPJS, HR, patient portal, AI features. Struktur `models/` dan
`app/api/` sudah mengikuti pola yang sama sehingga modul baru tinggal ditambahkan sebagai
Mongoose model + route CRUD + halaman admin baru, mengikuti pola `users` dan `settings`.
