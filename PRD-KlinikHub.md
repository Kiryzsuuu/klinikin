# Product Requirements Document (PRD)
## KlinikHub — Platform Manajemen Klinik Multi-Cabang

**Versi:** 1.0.0
**Tanggal:** 31 Agustus 2026
**Status:** Draft
**Author:** Product Team

---

## 1. Executive Summary

KlinikHub adalah platform SaaS manajemen klinik berbasis cloud yang dirancang khusus untuk **grup klinik multi-cabang** di Indonesia. Berbeda dari kompetitor seperti MyKlinik, Medisy, dan AIDO yang berfokus pada klinik tunggal, KlinikHub hadir sebagai solusi terintegrasi yang memungkinkan pemilik grup klinik mengelola seluruh cabang dalam satu dashboard terpusat — mulai dari RME, farmasi, keuangan, SDM, hingga analitik bisnis.

### Visi
> Menjadi platform manajemen kesehatan multi-cabang #1 di Indonesia yang menghubungkan seluruh ekosistem operasional klinik dalam satu sistem cerdas.

### Misi
Membantu grup klinik tumbuh lebih cepat dengan teknologi yang mengurangi beban operasional, meningkatkan kualitas layanan pasien, dan memberikan visibilitas bisnis secara real-time.

---

## 2. Latar Belakang & Analisis Pasar

### 2.1 Konteks Regulasi
- PMK No. 24 Tahun 2022 mewajibkan seluruh faskes menggunakan Rekam Medis Elektronik (RME)
- Per 2026, hampir 98% fasilitas kesehatan di Indonesia telah beralih ke RME
- Fasyankes yang tidak melaporkan data melalui SATUSEHAT dapat dikenai sanksi penurunan akreditasi

### 2.2 Analisis Kompetitor

| Aspek | MyKlinik | Medisy | AIDO Klinika | **KlinikHub** |
|---|---|---|---|---|
| Harga/bln | Rp 250.000 | Rp 300K–800K | Custom | Rp 500K–2.5jt |
| Multi-cabang | ❌ | ❌ | Terbatas | ✅ Penuh |
| Dashboard Konsolidasi | ❌ | ❌ | ❌ | ✅ |
| AI Features | ❌ | ❌ | ❌ | ✅ |
| Patient Portal | ❌ | Terbatas | Terbatas | ✅ |
| HR/Kepegawaian | ❌ | ❌ | ❌ | ✅ |
| Integrasi Asuransi Swasta | ❌ | ❌ | ❌ | ✅ |
| Sertifikasi ISO 27001 | ❌ | ❌ | ✅ | ✅ (target) |
| SATUSEHAT | ✅ | ✅ | ✅ | ✅ |
| BPJS PCare | ✅ | ✅ | ✅ | ✅ |

### 2.3 Target Segmen Pasar
- **Primary:** Grup klinik dengan 2–20 cabang (pratama, spesialis, kecantikan, gigi)
- **Secondary:** Klinik tunggal yang berencana ekspansi
- **TAM:** ±45.000 klinik terdaftar di Indonesia (Kemenkes 2025)
- **SAM:** ±8.000 grup klinik multi-cabang

---

## 3. User Personas

### Persona 1: Owner/Direktur Grup Klinik
**Nama:** dr. Budi Santoso
**Profil:** Memiliki 5 cabang klinik pratama di Jabodetabek
**Pain Points:**
- Harus mengunjungi tiap cabang untuk cek laporan keuangan
- Tidak tahu performa dokter tiap cabang secara real-time
- Sulit mengelola stok obat terpusat antar cabang
**Goals:** Visibilitas penuh bisnis dari satu layar, skalabilitas mudah

### Persona 2: Manajer Operasional Klinik
**Nama:** Siti Rahayu
**Profil:** Mengelola operasional harian 3 cabang klinik
**Pain Points:**
- Input data manual ke banyak sistem berbeda
- Jadwal dokter sering bentrok antar cabang
- Laporan harian memakan waktu lama
**Goals:** Efisiensi operasional, otomasi laporan, jadwal terpusat

### Persona 3: Dokter/Tenaga Medis
**Nama:** dr. Anisa Putri
**Profil:** Praktek di 2 cabang klinik yang sama
**Pain Points:**
- Harus input RME dua kali di sistem berbeda
- Tidak bisa akses riwayat pasien saat pindah cabang
**Goals:** RME cepat, akses data pasien lintas cabang, e-Resep mudah

### Persona 4: Pasien
**Nama:** Andi Wijaya
**Profil:** Pelanggan setia klinik, berobat rutin
**Pain Points:**
- Harus daftar ulang saat ke cabang berbeda
- Tidak bisa lihat riwayat medis sendiri
- Lupa jadwal kontrol
**Goals:** Booking mudah, akses riwayat medis, notifikasi jadwal

---

## 4. Scope Produk

### 4.1 Fitur Inti (MVP — Phase 1)

#### 4.1.1 Manajemen Multi-Cabang
- **Dashboard Konsolidasi Owner** — ringkasan semua cabang dalam satu tampilan
- **Manajemen Cabang** — tambah/edit/nonaktifkan cabang
- **Role & Permission** — akses berbasis peran per cabang (Owner, Admin Pusat, Admin Cabang, Dokter, Apoteker, Kasir)
- **Data Pasien Terpusat** — pasien yang pernah berobat di satu cabang otomatis terdaftar di semua cabang

#### 4.1.2 Rekam Medis Elektronik (RME)
- Pendaftaran & antrian pasien
- SOAP Notes dengan template ICD-10 & ICD-9
- CPPT (Catatan Perkembangan Pasien Terintegrasi)
- e-Resep & e-Rujukan
- Upload foto/dokumen medis
- Riwayat kunjungan lintas cabang
- Odontogram (klinik gigi)
- Skin Chart (klinik kecantikan)

#### 4.1.3 Farmasi & Apotek
- Manajemen stok obat per cabang
- Transfer stok antar cabang
- Alert stok kritis & kadaluarsa
- Pengurangan stok otomatis saat resep divalidasi
- Laporan penggunaan obat

#### 4.1.4 Kasir & Keuangan
- Point of Sale (POS) kasir
- Invoice & kwitansi digital
- Integrasi BPJS PCare & V-Claim
- Laporan pendapatan harian/mingguan/bulanan per cabang
- Konsolidasi laporan keuangan semua cabang

#### 4.1.5 Integrasi Wajib
- **SATUSEHAT** (Kemenkes) — auto-push data RME
- **BPJS PCare** — bridging klaim
- **BPJS Antrol v2** — antrian online
- **I-Care** — data pasien JKN

### 4.2 Fitur Lanjutan (Phase 2)

#### 4.2.1 AI & Otomasi
- **Voice-to-Text RME** — dokter cukup bicara, sistem transkrip otomatis ke SOAP
- **Smart Diagnosis Suggestion** — rekomendasi ICD-10 berdasarkan gejala
- **Prediksi Stok Obat** — AI prediksi kebutuhan obat berdasarkan tren historis
- **Auto-Summary Rekam Medis** — ringkasan riwayat pasien otomatis sebelum konsultasi

#### 4.2.2 HR & Kepegawaian
- Database pegawai terpusat (dokter, perawat, admin, dll)
- Jadwal shift & jadwal praktek dokter lintas cabang
- Absensi (integrasi fingerprint/face recognition)
- Slip gaji & perhitungan insentif otomatis

#### 4.2.3 Patient Portal
- Aplikasi mobile pasien (iOS & Android)
- Booking online & pilih dokter/cabang
- Akses riwayat medis & hasil lab
- Notifikasi jadwal kontrol via WhatsApp & push notification
- Telemedicine/konsultasi online

#### 4.2.4 Laporan & Analitik Bisnis
- Dashboard BI (Business Intelligence) owner
- Tren kunjungan per penyakit, per dokter, per cabang
- Revenue forecast berbasis AI
- KPI tracking dokter & staf
- Export laporan ke Excel/PDF

### 4.3 Fitur Tambahan (Phase 3)

- Integrasi asuransi swasta (Prudential, AXA, Allianz, dll)
- Modul Laboratorium & Radiologi (LIS/RIS)
- Integrasi alat medis (lab analyzer, ECG)
- API publik untuk integrasi pihak ketiga
- Modul akreditasi (checklist & laporan siap akreditasi)
- Marketplace obat (procurement dari supplier terintegrasi)

---

## 5. User Stories

### Epic 1: Multi-Cabang Management
```
US-001: Sebagai Owner, saya ingin melihat ringkasan semua cabang dalam satu dashboard
         agar saya tidak perlu login ke tiap cabang satu per satu.

US-002: Sebagai Owner, saya ingin menambah cabang baru dalam hitungan menit
         agar ekspansi bisnis tidak terhambat proses teknis.

US-003: Sebagai Admin Pusat, saya ingin mengatur role akses per cabang
         agar setiap staf hanya bisa akses data yang relevan.

US-004: Sebagai Manajer, saya ingin data pasien otomatis tersinkron antar cabang
         agar pasien tidak perlu daftar ulang di setiap kunjungan cabang beda.
```

### Epic 2: RME & Pelayanan Medis
```
US-005: Sebagai Dokter, saya ingin input SOAP dengan template yang cerdas
         agar proses pencatatan rekam medis lebih cepat dari sebelumnya.

US-006: Sebagai Dokter, saya ingin melihat riwayat pasien dari cabang lain
         agar saya punya konteks lengkap sebelum konsultasi.

US-007: Sebagai Dokter, saya ingin membuat e-Resep yang langsung terhubung ke apotek
         agar tidak ada delay antara resep ditulis dan obat disiapkan.
```

### Epic 3: Keuangan & Laporan
```
US-008: Sebagai Owner, saya ingin laporan pendapatan konsolidasi semua cabang
         agar saya bisa membandingkan performa tiap cabang setiap bulan.

US-009: Sebagai Kasir, saya ingin proses klaim BPJS otomatis dari data RME
         agar tidak ada input manual yang membuang waktu.
```

---

## 6. Non-Functional Requirements

### 6.1 Performa
- Waktu load halaman < 2 detik untuk koneksi 4G
- API response time < 500ms untuk operasi standar
- Mendukung concurrent users: minimal 500 per cabang

### 6.2 Keamanan
- Enkripsi data at-rest (AES-256) dan in-transit (TLS 1.3)
- Autentikasi Multi-Factor (MFA) untuk role Owner & Admin
- Audit log setiap akses & perubahan data medis
- Target sertifikasi ISO 27001 dalam 18 bulan
- GDPR-compliant & sesuai UU PDP Indonesia No. 27 Tahun 2022

### 6.3 Ketersediaan
- SLA uptime: 99.9% (downtime maksimal ~8.7 jam/tahun)
- Backup data otomatis setiap 6 jam
- Disaster recovery dengan RTO < 4 jam

### 6.4 Skalabilitas
- Arsitektur horizontal scaling
- Mendukung hingga 1.000 cabang dalam satu tenant
- Data storage scalable sesuai pertumbuhan

### 6.5 Compliance
- 100% sesuai PMK No. 24 Tahun 2022
- Integrasi SATUSEHAT menggunakan HL7 FHIR R4
- Support ICD-10, ICD-9-CM, SNOMED-CT

---

## 7. Pricing Strategy

| Paket | Harga/bln | Cabang | Fitur |
|---|---|---|---|
| **Starter** | Rp 500.000 | 1 cabang | RME, Kasir, Farmasi, BPJS, SATUSEHAT |
| **Growth** | Rp 1.200.000 | 1–5 cabang | Starter + Dashboard Konsolidasi, HR Dasar |
| **Business** | Rp 2.500.000 | 6–20 cabang | Growth + AI Features, Patient Portal, BI |
| **Enterprise** | Custom | >20 cabang | All features + dedicated support + SLA custom |

*Semua paket: Unlimited User, Free Training, Free Migration Data*

---

## 8. Go-To-Market Strategy

### Phase 0 — Pre-launch (Bulan 1–3)
- Riset mendalam & validasi dengan 10 owner klinik
- Build MVP core features
- Rekrut 5 klinik beta tester (free 3 bulan)

### Phase 1 — Soft Launch (Bulan 4–6)
- Launch paket Starter & Growth
- Fokus Jabodetabek & Bandung
- Kemitraan dengan asosiasi klinik (ASNAKES, PERKESMAS)

### Phase 2 — Scale (Bulan 7–12)
- Ekspansi ke kota tier-1 lainnya (Surabaya, Medan, Makassar)
- Launch fitur AI & Patient Portal
- Program referral antar klinik

### Phase 3 — National (Bulan 13–24)
- Ekspansi nasional
- Launch Enterprise plan
- Integrasi asuransi swasta

---

## 9. Success Metrics (KPI)

| Metrik | Target 6 Bln | Target 12 Bln |
|---|---|---|
| Klinik aktif | 50 | 200 |
| Cabang terdaftar | 150 | 800 |
| MRR | Rp 75 jt | Rp 400 jt |
| Churn Rate | < 5% | < 3% |
| NPS Score | > 40 | > 60 |
| SATUSEHAT compliance rate | 100% | 100% |

---

## 10. Risiko & Mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Perubahan API SATUSEHAT/BPJS | Tinggi | Tinggi | Tim dedicated integrasi, monitoring API |
| Kompetitor turunkan harga | Sedang | Sedang | Fokus pada value multi-cabang yang unik |
| Data breach | Rendah | Sangat Tinggi | ISO 27001, penetration testing rutin |
| Lambatnya adopsi digital klinik | Sedang | Sedang | Free onboarding & training intensif |
| Regulasi baru Kemenkes | Sedang | Tinggi | Legal counsel khusus healthtech |

---

## 11. Timeline Roadmap

```
Q4 2026 — MVP Phase 1
├── Core RME (SOAP, ICD-10, e-Resep)
├── Multi-cabang basic (2–5 cabang)
├── Kasir & BPJS integration
├── SATUSEHAT integration
└── Beta launch 5 klinik

Q1 2027 — Phase 2
├── Dashboard konsolidasi owner
├── Manajemen stok antar cabang
├── HR dasar (jadwal dokter)
├── Patient portal web
└── Soft launch publik

Q2 2027 — Phase 3
├── AI Voice-to-Text RME
├── AI Diagnosis suggestion
├── Mobile app pasien
├── BI Dashboard
└── Growth launch

Q3–Q4 2027 — Phase 4
├── Integrasi asuransi swasta
├── Modul Lab & Radiologi
├── API publik
└── Enterprise launch
```

---

*Dokumen ini bersifat living document dan akan diperbarui seiring perkembangan produk.*
*Untuk pertanyaan: product@klinkhub.id*
