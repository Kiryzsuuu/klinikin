# KlinikKita

Platform manajemen klinik multi-cabang (monolith Next.js), dibangun sebelum dipecah menjadi
microservices sesuai [`TECH-ARCHITECTURE-KlinikHub.md`](./TECH-ARCHITECTURE-KlinikHub.md).

## Fitur yang sudah ada

**Fondasi**
- Autentikasi + OTP email (staf & pasien) via Gmail SMTP
- Manajemen User staf (CRUD penuh, role, foto)
- Site Settings fully customizable (branding, tema warna, font, kontak, sosial media, maintenance mode)
- Semua gambar disimpan sebagai base64 langsung di MongoDB (maks 2MB/gambar)
- Palet warna `#F5F5F5 / #B9E937 / #57D131 / #406661` + font **Fredoka**
- API publik untuk pihak ketiga (`/api/public/v1/*`, auth via API key, kelola di `/admin/api-keys`)

**Operasional Klinik**
- Manajemen Cabang (CRUD)
- Data Pasien terpusat lintas cabang + RME (SOAP notes, diagnosis ICD-10, riwayat kunjungan)
- Odontogram (klinik gigi) & Skin Chart (klinik kecantikan) di setiap kunjungan
- Farmasi & Stok Obat, termasuk transfer stok antar cabang
- Kasir & Invoice (multi item, status pembayaran)
- Laboratorium & Radiologi (order, hasil teks + file)
- Asuransi swasta — daftar provider + pelacakan status klaim manual
- Procurement obat — supplier + purchase order, stok otomatis bertambah saat status RECEIVED
- SDM — jadwal praktik/shift staf per cabang
- Checklist Akreditasi per cabang dengan bukti upload
- Booking Pasien publik (`/booking`) — admin konfirmasi → otomatis buat pasien + kunjungan RME

**Patient Portal (`/portal`)**
- Pasien daftar akun sendiri (cocokkan No. RM + telepon dari data klinik) + verifikasi OTP email
- Login terpisah dari staf (session cookie berbeda)
- Lihat riwayat kunjungan, diagnosis, obat, dan hasil lab sendiri
- Booking konsultasi baru langsung dari dashboard

**AI (lewat Groq — `@ai-sdk/groq`)**
- ✨ Smart Diagnosis Suggestion — saran ICD-10 dari gejala
- ✨ Auto-Summary Rekam Medis — ringkasan riwayat pasien sebelum konsultasi
- ✨ Voice-to-Text RME — rekam suara dokter, ditranskrip otomatis (Groq Whisper) ke kolom Subjective
- ✨ Prediksi Stok Obat — estimasi kebutuhan 30 hari berdasarkan tren penjualan invoice
- ✨ Revenue Forecast — analisis tren pendapatan 6 bulan di dashboard
- ✨ Asisten AI Chat internal untuk staf (`/admin/chat`)

**Konsultasi Online (Interactive Call)**
- Video call 1:1 berbasis WebRTC P2P (`/call/[roomId]`), signaling lewat polling API — **tidak
  butuh akun provider pihak ketiga**, cukup browser modern + izin kamera/mikrofon. Room dibuat
  otomatis saat booking dengan tipe "Konsultasi Online" dikonfirmasi.

**Keamanan & Compliance**
- Audit Log (`/admin/audit-log`) — mencatat setiap akses & perubahan data pasien/kunjungan/user/
  settings/API key (NFR wajib di PRD)
- MFA/TOTP (`/admin/security`) — opsional per akun, sangat disarankan untuk OWNER & ADMIN_PUSAT;
  begitu diaktifkan, login akan minta kode dari Google Authenticator/Authy setelah password benar

**RME Lanjutan**
- e-Resep & e-Rujukan bisa diisi per kunjungan dan dicetak (halaman print-friendly, tombol "Cetak")
- Lampiran foto/dokumen medis per kunjungan (base64, maks 2MB/file)
- KPI dokter (jumlah & penyelesaian kunjungan bulanan) di dashboard
- Tracking batch & tanggal kadaluarsa obat di Farmasi, dengan badge peringatan ≤30 hari

**Laporan**
- Export CSV (buka di Excel) untuk Data Pasien dan Kasir/Invoice

**Background Jobs (Vercel Cron)**
- `vercel.json` menjadwalkan `/api/cron/stock-alert` (harian) dan `/api/cron/daily-report`
  (harian) — mengirim email ringkasan ke OWNER/ADMIN_PUSAT. Endpoint dilindungi `CRON_SECRET`;
  di luar Vercel, jadwalkan sendiri lewat cron/task scheduler yang memanggil endpoint tersebut
  dengan header `Authorization: Bearer <CRON_SECRET>`.

## Yang masih perlu tindakan Anda (butuh akun/kredensial pihak ketiga)

Kerangka kodenya sudah disiapkan, tapi tidak bisa aktif tanpa Anda mendaftar & mengisi kredensial
sendiri di `.env.local`:

- **SATUSEHAT** (`lib/integrations/satusehat.ts`) — client_id/secret resmi dari Kemenkes
- **BPJS PCare** (`lib/integrations/bpjs.ts`) — Cons ID/Secret Key resmi dari BPJS Kesehatan
- **WhatsApp notifikasi** (`lib/integrations/whatsapp.ts`) — token device Fonnte
- **Groq AI** — `GROQ_API_KEY` dari console.groq.com, plus verifikasi `GROQ_MODEL` &
  `GROQ_TRANSCRIBE_MODEL` masih tersedia (daftar model Groq berubah cukup sering)

**Catatan jujur soal "Asuransi Swasta" & "Procurement Obat":** tidak ada API generik untuk
integrasi ke insurer atau marketplace obat pihak ketiga — masing-masing punya sistem sendiri.
Modul ini jadi pencatatan/pelacakan status manual, bukan submit/order otomatis ke pihak eksternal.

## Yang masih belum dikerjakan (di luar cakupan software murni)

- **Absensi fingerprint/face recognition** & **slip gaji/insentif otomatis** — butuh integrasi
  perangkat keras fisik yang tidak bisa disediakan lewat kode saja
- **Integrasi alat medis** (lab analyzer, ECG) — butuh driver/protokol alat fisik tertentu
- **Aplikasi mobile pasien (React Native)** — di luar cakupan, saat ini hanya web portal

## Setup

```bash
npm install
cp .env.example .env.local
# isi MONGODB_URI, GMAIL_USER, GMAIL_APP_PASSWORD, JWT_SECRET, GROQ_API_KEY

npm run seed   # buat akun OWNER pertama
npm run dev
```

Buka http://localhost:3000 — login staf di `/login`, kelola semuanya di `/admin`. Pasien
mendaftar/login sendiri di `/portal`. Landing page publik (`/`) dan form booking (`/booking`)
tidak butuh login sama sekali.

### Catatan Gmail SMTP
Gunakan **App Password** (bukan password akun biasa): aktifkan 2-Step Verification lalu buat App
Password di https://myaccount.google.com/apppasswords.

### Catatan Groq
Ambil `GROQ_API_KEY` di https://console.groq.com/keys. Cek model chat & Whisper transcription
yang masih didukung di https://console.groq.com/docs/models sebelum deploy — jangan asumsikan
default di `.env.example` masih berlaku.

## Struktur

```
app/
  page.tsx, booking/, call/[roomId]/        # halaman publik
  login, register, verify-otp, forgot/reset-password/   # auth staf
  portal/                                    # auth & dashboard pasien
  admin/                                     # butuh login staf: dashboard, branches, patients,
                                              # pharmacy, cashier, hr, bookings, lab, insurance,
                                              # procurement, accreditation, chat, users, settings, api-keys
  api/
    auth/, admin/users/, settings/           # fondasi staf
    patient-auth/                            # fondasi pasien
    branches/, patients/, visits/, medicines/, invoices/, hr/shifts/, bookings/, calls/
    lab-orders/, insurance/, suppliers/, purchase-orders/, accreditation/, admin/api-keys/
    public/v1/                               # API publik pihak ketiga (auth: X-API-Key)
    ai/                                      # diagnosis-suggestion, patient-summary, chat,
                                              # transcribe, stock-prediction, revenue-forecast
lib/
  db, mailer, jwt, auth, patientAuth, otp, response, image, guard, ai, apiKeyAuth, fileToBase64
  integrations/                              # satusehat, bpjs, whatsapp (skeleton, butuh kredensial)
models/                                      # User, Otp, SiteSettings, Branch, Patient, Visit,
                                              # Medicine, StockTransfer, Invoice, Shift, Booking,
                                              # CallSession, LabOrder, Insurance*, ApiKey,
                                              # AccreditationItem, Supplier, PurchaseOrder
components/                                  # ui, VoiceRecorder, Odontogram, SkinChart
scripts/seed.ts
proxy.ts                                     # proteksi route /admin/* (Next 16 "proxy")
```
