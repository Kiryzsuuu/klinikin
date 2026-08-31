# KlinikHub

Platform manajemen klinik multi-cabang (monolith Next.js), dibangun sebelum dipecah menjadi
microservices sesuai [`TECH-ARCHITECTURE-KlinikHub.md`](./TECH-ARCHITECTURE-KlinikHub.md).

## Fitur yang sudah ada

**Fondasi**
- Autentikasi + OTP email (register, login, lupa/reset password) via Gmail SMTP
- Manajemen User (CRUD penuh, role, foto)
- Site Settings fully customizable (branding, tema warna, font, kontak, sosial media, maintenance mode)
- Semua gambar disimpan sebagai base64 langsung di MongoDB (maks 2MB/gambar)
- Palet warna `#F5F5F5 / #B9E937 / #57D131 / #406661` + font **Fredoka**

**Operasional Klinik**
- Manajemen Cabang (CRUD)
- Data Pasien terpusat lintas cabang + RME (SOAP notes, diagnosis ICD-10, riwayat kunjungan)
- Farmasi & Stok Obat, termasuk transfer stok antar cabang
- Kasir & Invoice (multi item, status pembayaran)
- SDM dasar — jadwal praktik/shift staf per cabang
- Booking Pasien publik (`/booking`, tanpa perlu akun) — admin konfirmasi → otomatis buat pasien + kunjungan RME

**AI (lewat Vercel AI Gateway)**
- ✨ Smart Diagnosis Suggestion — saran ICD-10 dari gejala (di halaman detail pasien)
- ✨ Auto-Summary Rekam Medis — ringkasan riwayat pasien sebelum konsultasi
- ✨ Asisten AI Chat internal untuk staf (`/admin/chat`)

**Konsultasi Online (Interactive Call)**
- Video call 1:1 berbasis WebRTC P2P (`/call/[roomId]`), signaling lewat polling API — **tidak
  butuh akun provider pihak ketiga**, cukup browser modern + izin kamera/mikrofon. Room dibuat
  otomatis saat booking dengan tipe "Konsultasi Online" dikonfirmasi.

## Yang BELUM diimplementasikan (butuh akun/kredensial pihak ketiga)

Kerangka kodenya sudah disiapkan di `lib/integrations/`, tapi tidak bisa aktif tanpa Anda
mendaftar & mengisi kredensial sendiri di `.env.local`:

- **SATUSEHAT** (`lib/integrations/satusehat.ts`) — butuh client_id/secret resmi dari Kemenkes
- **BPJS PCare** (`lib/integrations/bpjs.ts`) — butuh Cons ID/Secret Key resmi dari BPJS Kesehatan
- **WhatsApp notifikasi** (`lib/integrations/whatsapp.ts`) — butuh token device Fonnte

Juga belum ada: dashboard BI lanjutan (revenue forecast AI), Prediksi Stok Obat AI, akun login
khusus pasien (saat ini booking tanpa akun), modul Lab/Radiologi, integrasi asuransi swasta, API
publik.

## Setup

```bash
npm install
cp .env.example .env.local
# isi MONGODB_URI, GMAIL_USER, GMAIL_APP_PASSWORD, JWT_SECRET, AI_GATEWAY_API_KEY

npm run seed   # buat akun OWNER pertama
npm run dev
```

Buka http://localhost:3000 — login di `/login`, kelola semuanya di `/admin`. Landing page publik
(`/`) dan form booking (`/booking`) tidak butuh login.

### Catatan Gmail SMTP
Gunakan **App Password** (bukan password akun biasa): aktifkan 2-Step Verification lalu buat App
Password di https://myaccount.google.com/apppasswords.

### Catatan AI Gateway
Ambil `AI_GATEWAY_API_KEY` di https://vercel.com/[team]/~/ai-gateway/api-keys. Saat deploy di
Vercel, biasanya terautentikasi otomatis lewat OIDC tanpa perlu isi key manual.

## Struktur

```
app/
  page.tsx, booking/, call/[roomId]/        # halaman publik
  login, register, verify-otp, forgot/reset-password/
  admin/                                     # butuh login: dashboard, branches, patients,
                                              # pharmacy, cashier, hr, bookings, chat, users, settings
  api/
    auth/, admin/users/, settings/           # fondasi
    branches/, patients/, visits/, medicines/, invoices/, hr/shifts/, bookings/, calls/
    ai/                                      # diagnosis-suggestion, patient-summary, chat
lib/
  db, mailer, jwt, auth, otp, response, image, guard, ai, fileToBase64
  integrations/                              # satusehat, bpjs, whatsapp (skeleton, butuh kredensial)
models/                                      # User, Otp, SiteSettings, Branch, Patient, Visit,
                                              # Medicine, StockTransfer, Invoice, Shift, Booking, CallSession
scripts/seed.ts
proxy.ts                                     # proteksi route /admin/* (Next 16 "proxy")
```
