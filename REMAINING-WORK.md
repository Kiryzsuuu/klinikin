# Catatan Pekerjaan yang Belum Selesai — KlinikHub

Dokumen ini merangkum bagian dari [`PRD-KlinikHub.md`](./PRD-KlinikHub.md) dan
[`TECH-ARCHITECTURE-KlinikHub.md`](./TECH-ARCHITECTURE-KlinikHub.md) yang **belum** ada kodenya,
serta yang sudah ada kode tapi butuh tindakan tambahan dari Anda sebelum benar-benar aktif.

Status per 2026-09-02.

---

## 1. Butuh akun/kredensial pihak ketiga (kode sudah siap)

Kerangka kodenya sudah dibuat, tinggal diisi kredensial di `.env.local`:

| Fitur | Lokasi kode | Yang perlu Anda lakukan |
|---|---|---|
| SATUSEHAT (Kemenkes) | `lib/integrations/satusehat.ts` | Daftar organisasi di satusehat.kemkes.go.id, isi `SATUSEHAT_CLIENT_ID`/`SATUSEHAT_CLIENT_SECRET` |
| BPJS PCare v2 | `lib/integrations/bpjs.ts` | Ajukan akses di trkendali.bpjs-kesehatan.go.id, isi `BPJS_CONS_ID`/`BPJS_SECRET_KEY`/`BPJS_USER_KEY` |
| WhatsApp notifikasi | `lib/integrations/whatsapp.ts` | Daftar & hubungkan device di fonnte.com, isi `FONNTE_TOKEN` |
| AI (diagnosis suggestion, auto-summary, voice-to-text, chat, stock prediction, revenue forecast) | `lib/ai.ts` | Ambil `GROQ_API_KEY` di console.groq.com/keys. **Verifikasi ulang** `GROQ_MODEL` & `GROQ_TRANSCRIBE_MODEL` masih didukung di console.groq.com/docs/models — daftar model Groq berubah cukup sering |
| Background jobs (stock-alert, daily-report) | `vercel.json`, `app/api/cron/*` | Isi `CRON_SECRET` di `.env.local` **dan** sebagai env var project (Vercel, atau scheduler lain di luar Vercel yang memanggil endpoint dengan header `Authorization: Bearer <CRON_SECRET>`) |

**Catatan jujur soal "Asuransi Swasta" & "Procurement Obat":** modul ini SUDAH ada
(`/admin/insurance`, `/admin/procurement`), tapi hanya pencatatan/pelacakan status manual — tidak
ada API generik untuk submit klaim otomatis ke insurer atau order otomatis ke marketplace obat
pihak ketiga, karena masing-masing punya sistem tertutup sendiri.

---

## 2. Belum ada kodenya sama sekali

Butuh perangkat keras fisik atau infrastruktur terpisah yang tidak bisa disediakan lewat kode
software saja:

- **Absensi fingerprint/face recognition** (PRD §4.2.2) — butuh integrasi perangkat keras
- **Slip gaji & perhitungan insentif otomatis** (PRD §4.2.2) — belum ada modul payroll
- **Integrasi alat medis** — lab analyzer, ECG (PRD §4.3) — butuh driver/protokol alat fisik
  tertentu per merek alat
- **Aplikasi mobile pasien (React Native)** (PRD §4.2.3) — saat ini hanya web Patient Portal
  (`/portal`), belum ada aplikasi mobile native

Di luar itu, murni belum sempat dikerjakan (tidak ada blocker teknis, bisa ditambahkan kapan saja
mengikuti pola modul yang sudah ada):

- Export laporan ke **PDF** (CSV/Excel sudah ada di `/api/export/*`, PDF belum)
- **Auto-summary otomatis terjadwal** (saat ini manual via tombol, belum ada trigger otomatis
  pasca-kunjungan selesai)
- **Notifikasi WhatsApp otomatis** untuk booking terkonfirmasi/reminder kontrol (kode kirim WA
  sudah ada di `lib/integrations/whatsapp.ts`, tapi belum dipasang sebagai trigger di alur
  booking/kontrol — nunggu `FONNTE_TOKEN` diisi lebih dulu)
- **Retry otomatis untuk sync SATUSEHAT/BPJS yang gagal** (disebut sebagai job terjadwal di
  TECH-ARCHITECTURE §10, belum relevan sampai integrasi SATUSEHAT/BPJS aktif)
- **Backup-check otomatis** (verifikasi harian bahwa backup MongoDB berhasil) — bergantung pada
  provider hosting MongoDB yang dipakai (mis. Atlas punya backup bawaan, tinggal dicek manual dulu)

---

## 3. Sudah ada kode, tapi baru versi dasar (bisa diperluas)

- **Dashboard BI** — statistik dasar (kunjungan, pendapatan, distribusi role, KPI dokter) sudah
  ada; belum ada breakdown per penyakit/diagnosis, grafik tren multi-bulan, atau filter custom
  date range
- **RBAC** — role-based access sudah jalan (`lib/guard.ts`), tapi masih role-level (bukan
  permission granular per fitur/aksi)
- **Notifikasi in-app** — belum ada, saat ini semua notifikasi lewat email (OTP, alert stok,
  laporan harian)

---

## Ringkasan cepat: apa yang HARUS Anda lakukan supaya semua fitur software aktif

1. Isi `MONGODB_URI`, `JWT_SECRET`, `GMAIL_USER`/`GMAIL_APP_PASSWORD` — wajib untuk aplikasi jalan sama sekali
2. Isi `GROQ_API_KEY` + verifikasi `GROQ_MODEL`/`GROQ_TRANSCRIBE_MODEL` — untuk semua fitur AI
3. (Opsional) Isi `CRON_SECRET` + set env var yang sama di Vercel — untuk stock-alert & daily-report otomatis
4. (Opsional, saat siap produksi) SATUSEHAT, BPJS, Fonnte — masing-masing butuh pendaftaran resmi terpisah di luar kendali kode ini
