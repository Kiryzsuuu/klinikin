# Technical Architecture Document
## KlinikHub — Platform Manajemen Klinik Multi-Cabang

**Versi:** 1.0.0
**Tanggal:** 31 Agustus 2026
**Stack:** React · Node.js · MongoDB
**Status:** Draft

---

## 1. Overview Arsitektur

KlinikHub menggunakan arsitektur **Microservices berbasis Node.js** dengan frontend **React (Next.js)**, database **MongoDB**, dan komunikasi antar service menggunakan **REST API + Event Queue (BullMQ/Redis)**. Desain ini memungkinkan setiap modul berkembang secara independen dan sistem tetap scalable seiring pertumbuhan cabang.

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│   Web App (Next.js)  │  Mobile (React Native) [P2]      │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────────────┐
│              API GATEWAY (Node.js + Express)             │
│    Auth · Rate Limiting · Routing · Logging              │
└───┬─────────┬────────┬──────────┬───────────┬───────────┘
    │         │        │          │           │
┌───▼───┐ ┌──▼──┐ ┌───▼──┐ ┌────▼───┐ ┌─────▼────┐
│ Auth  │ │ RME │ │Pharma│ │Finance │ │  Branch  │
│Service│ │Svc  │ │ Svc  │ │  Svc   │ │   Svc    │
└───┬───┘ └──┬──┘ └───┬──┘ └────┬───┘ └─────┬────┘
    │        │        │         │            │
┌───▼────────▼────────▼─────────▼────────────▼────────────┐
│                   MESSAGE QUEUE (Redis + BullMQ)          │
│         Event-driven communication antar service          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   DATA LAYER                             │
│  MongoDB Atlas (Multi-tenant)  │  Redis (Cache/Queue)    │
│  MinIO / S3 (File Storage)     │  ElasticSearch (Search) │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack Detail

### 2.1 Frontend

| Komponen | Teknologi | Alasan |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR/SSG, SEO, performa tinggi |
| UI Library | React 19 | Ekosistem luas, component-based |
| Styling | Tailwind CSS + shadcn/ui | Cepat, konsisten, accessible |
| State Management | Zustand + TanStack Query | Ringan, server state terintegrasi |
| Form | React Hook Form + Zod | Validasi schema, performa |
| Charts/BI | Recharts + Apache ECharts | Visualisasi data medis & bisnis |
| Real-time | Socket.io Client | Antrian pasien, notifikasi live |
| PWA | next-pwa | Offline capability untuk klinik |

### 2.2 Backend

| Komponen | Teknologi | Alasan |
|---|---|---|
| Runtime | Node.js 22 LTS | Performa async, ekosistem npm |
| Framework | Express.js + Fastify (per service) | Fleksibel, ringan, cepat |
| API Style | REST + WebSocket | REST untuk CRUD, WS untuk real-time |
| Validation | Zod | Type-safe, schema sharing dengan FE |
| Auth | JWT + Refresh Token + MFA | Stateless, secure |
| Queue | BullMQ + Redis | Job processing, async tasks |
| ORM/ODM | Mongoose 8 | Schema definition, MongoDB native |
| Testing | Jest + Supertest | Unit & integration testing |
| Docs | Swagger/OpenAPI 3.1 | API documentation otomatis |

### 2.3 Database

| Komponen | Teknologi | Alasan |
|---|---|---|
| Primary DB | MongoDB Atlas (M30+) | Flexible schema untuk data medis |
| Cache | Redis 7 | Session, cache, rate limiting |
| Search | MongoDB Atlas Search | Full-text search pasien & obat |
| File Storage | AWS S3 / MinIO | Foto pasien, dokumen medis |
| Backup | MongoDB Atlas Backup | Point-in-time recovery |

### 2.4 Infrastructure & DevOps

| Komponen | Teknologi |
|---|---|
| Cloud | AWS (ap-southeast-1, Jakarta) |
| Container | Docker + Docker Compose |
| Orchestration | Kubernetes (EKS) untuk production |
| CI/CD | GitHub Actions |
| Monitoring | Grafana + Prometheus + Loki |
| Error Tracking | Sentry |
| CDN | CloudFront |
| DNS & SSL | Route53 + ACM |

---

## 3. Multi-Tenancy Strategy

KlinikHub menggunakan pendekatan **Hybrid Multi-Tenancy**:

```
Tenant = Grup Klinik (Owner)
  └── Branches[] = Cabang-cabang klinik
        └── Users[] = Staf per cabang
```

### 3.1 Database Strategy: Tenant-per-Collection dengan Tenant ID

Setiap dokumen MongoDB menyimpan `tenantId` dan `branchId` untuk isolasi data:

```javascript
// Contoh schema pasien
{
  _id: ObjectId,
  tenantId: ObjectId,      // ID grup klinik
  branchId: ObjectId,      // ID cabang tempat daftar pertama
  medicalRecordNo: String, // Unik per tenant
  personalInfo: { ... },
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 Middleware Tenant Isolation

```javascript
// middleware/tenant.middleware.js
const tenantMiddleware = async (req, res, next) => {
  const { tenantId, branchId, role } = req.user;
  
  // Inject ke semua query MongoDB
  req.tenantScope = { tenantId };
  req.branchScope = role === 'OWNER' ? {} : { branchId };
  
  next();
};
```

---

## 4. Struktur Proyek (Monorepo)

```
klinkhub/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── owner/      # Dashboard Owner (semua cabang)
│   │   │   │   ├── branch/     # Dashboard per cabang
│   │   │   │   ├── rme/        # Rekam Medis
│   │   │   │   ├── pharmacy/   # Farmasi
│   │   │   │   ├── finance/    # Keuangan
│   │   │   │   └── settings/
│   │   │   └── api/            # Next.js API routes (BFF)
│   │   ├── components/
│   │   │   ├── ui/             # Base UI (shadcn)
│   │   │   ├── rme/            # Komponen RME spesifik
│   │   │   ├── charts/         # Komponen visualisasi
│   │   │   └── shared/
│   │   └── lib/
│   │
│   └── patient-portal/         # Next.js untuk pasien [Phase 2]
│
├── services/
│   ├── api-gateway/            # Entry point, routing, auth check
│   ├── auth-service/           # Autentikasi & otorisasi
│   ├── rme-service/            # Rekam Medis Elektronik
│   ├── pharmacy-service/       # Farmasi & stok obat
│   ├── finance-service/        # Kasir & keuangan
│   ├── branch-service/         # Manajemen cabang & pasien
│   ├── hr-service/             # SDM & kepegawaian [Phase 2]
│   ├── notification-service/   # WhatsApp, Email, Push notif
│   └── integration-service/    # SATUSEHAT, BPJS, I-Care
│
├── packages/
│   ├── shared-types/           # TypeScript types bersama
│   ├── shared-utils/           # Helper functions
│   ├── shared-validators/      # Zod schemas bersama
│   └── ui-kit/                 # Shared UI components
│
├── infrastructure/
│   ├── docker/
│   ├── k8s/
│   └── terraform/
│
├── .github/workflows/
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml
└── README.md
```

---

## 5. MongoDB Schema Design

### 5.1 Collection: `tenants` (Grup Klinik)

```javascript
{
  _id: ObjectId,
  name: String,               // "Klinik Sehat Group"
  slug: String,               // "klinik-sehat-group"
  subscriptionPlan: {
    type: { type: String, enum: ['STARTER','GROWTH','BUSINESS','ENTERPRISE'] },
    startDate: Date,
    endDate: Date,
    maxBranches: Number
  },
  settings: {
    timezone: String,         // "Asia/Jakarta"
    currency: String,         // "IDR"
    language: String          // "id"
  },
  billingInfo: { ... },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2 Collection: `branches` (Cabang Klinik)

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,         // ref: tenants
  name: String,               // "Klinik Sehat - Depok"
  code: String,               // "KSD-001"
  type: String,               // "PRATAMA" | "UTAMA" | "SPESIALIS"
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    coordinates: { lat: Number, lng: Number }
  },
  contact: {
    phone: String,
    whatsapp: String,
    email: String
  },
  operationalHours: [{
    day: Number,              // 0=Minggu, 1=Senin, dst
    open: String,             // "08:00"
    close: String             // "17:00"
  }],
  bpjsInfo: {
    puskesmasCode: String,
    pCareUsername: String,
    pCarePassword: String     // encrypted
  },
  satuSehatInfo: {
    organizationId: String,
    locationId: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5.3 Collection: `users` (Pengguna/Staf)

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  email: String,
  passwordHash: String,
  profile: {
    fullName: String,
    nik: String,
    phone: String,
    photo: String             // S3 URL
  },
  role: {
    type: String,             // "OWNER"|"ADMIN_PUSAT"|"ADMIN_CABANG"|"DOKTER"|"PERAWAT"|"APOTEKER"|"KASIR"
    branchAccess: [ObjectId]  // cabang yang bisa diakses
  },
  doctorInfo: {               // hanya untuk role DOKTER
    str: String,
    sip: String,
    specialization: String,
    bpjsCode: String
  },
  mfaEnabled: Boolean,
  mfaSecret: String,          // encrypted
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5.4 Collection: `patients` (Pasien)

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  medicalRecordNo: String,    // auto-generate per tenant, e.g. "KSG-2026-000001"
  registeredBranchId: ObjectId,
  personalInfo: {
    nik: String,              // encrypted + indexed
    name: String,
    dateOfBirth: Date,
    gender: String,           // "L" | "P"
    bloodType: String,
    religion: String,
    maritalStatus: String,
    occupation: String,
    address: { ... },
    phone: String,
    email: String,
    photo: String
  },
  insuranceInfo: [{
    type: String,             // "BPJS" | "ASURANSI_SWASTA"
    provider: String,
    memberNo: String,         // encrypted
    class: String,            // "1" | "2" | "3"
    isActive: Boolean
  }],
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  allergies: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 5.5 Collection: `visits` (Kunjungan/RME)

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  branchId: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  visitNo: String,            // "KSD-20260831-001"
  visitDate: Date,
  visitType: String,          // "RAWAT_JALAN" | "RAWAT_INAP" | "UGD"
  paymentType: String,        // "UMUM" | "BPJS" | "ASURANSI"
  status: String,             // "WAITING"|"IN_PROGRESS"|"DONE"|"CANCELLED"
  
  subjective: String,         // Keluhan utama
  objective: {
    vitalSigns: {
      bloodPressure: String,
      pulse: Number,
      temperature: Number,
      respiratoryRate: Number,
      weight: Number,
      height: Number,
      bmi: Number
    },
    physicalExam: String,
    attachments: [String]     // S3 URLs
  },
  assessment: {
    diagnoses: [{
      icdCode: String,        // "A09"
      icdDescription: String, // "Diarrhoea and gastroenteritis..."
      type: String            // "PRIMARY" | "SECONDARY"
    }]
  },
  plan: {
    medications: [{
      medicineId: ObjectId,
      medicineName: String,
      dosage: String,
      frequency: String,
      duration: String,
      notes: String
    }],
    procedures: [{
      icd9Code: String,
      description: String,
      notes: String
    }],
    referral: {
      isReferred: Boolean,
      referralTo: String,
      reason: String,
      referralLetterUrl: String
    },
    controlDate: Date,
    doctorNotes: String
  },
  
  satuSehatStatus: {
    encounterResourceId: String,
    isSynced: Boolean,
    lastSyncAt: Date,
    syncError: String
  },
  bpjsStatus: {
    noSEP: String,
    isPCareSubmitted: Boolean,
    submittedAt: Date
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 5.6 Collection: `medicines` (Obat & Stok)

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  branchId: ObjectId,
  
  medicine: {
    name: String,
    genericName: String,
    category: String,
    unit: String,             // "tablet" | "kapsul" | "ml" | dst
    bpjsCode: String,
    manufacturer: String
  },
  stock: {
    current: Number,
    minimum: Number,          // threshold alert
    unit: String
  },
  pricing: {
    buyPrice: Number,
    sellPrice: Number,
    bpjsPrice: Number
  },
  batches: [{
    batchNo: String,
    expiredDate: Date,
    quantity: Number,
    receivedDate: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 5.7 Collection: `invoices` (Tagihan)

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  branchId: ObjectId,
  visitId: ObjectId,
  patientId: ObjectId,
  invoiceNo: String,
  
  items: [{
    type: String,             // "CONSULTATION" | "MEDICINE" | "PROCEDURE" | "LAB"
    name: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number
  }],
  
  subtotal: Number,
  discount: Number,
  tax: Number,
  total: Number,
  
  payment: {
    method: String,           // "CASH"|"TRANSFER"|"QRIS"|"BPJS"|"INSURANCE"
    status: String,           // "UNPAID"|"PAID"|"PARTIAL"|"REFUNDED"
    paidAmount: Number,
    paidAt: Date,
    receiptUrl: String
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. API Design

### 6.1 Base URL Structure

```
https://api.klinkhub.id/v1/{service}/{resource}

Contoh:
GET  /v1/branches                    # List semua cabang (owner)
GET  /v1/branches/:branchId          # Detail cabang
POST /v1/rme/visits                  # Buat kunjungan baru
GET  /v1/rme/visits/:visitId         # Detail kunjungan
GET  /v1/patients/:patientId/history # Riwayat lintas cabang
POST /v1/pharmacy/medicines/transfer # Transfer stok antar cabang
GET  /v1/finance/reports/consolidated # Laporan konsolidasi owner
```

### 6.2 Authentication Flow

```
1. POST /v1/auth/login
   Body: { email, password }
   Response: { accessToken (15 menit), refreshToken (7 hari) }

2. Header setiap request:
   Authorization: Bearer <accessToken>

3. POST /v1/auth/refresh
   Body: { refreshToken }
   Response: { accessToken baru }

4. MFA (untuk Owner & Admin Pusat):
   POST /v1/auth/mfa/verify
   Body: { totp }
```

### 6.3 Response Format Standar

```javascript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Pasien dengan ID tersebut tidak ditemukan",
    "details": { ... }
  }
}
```

---

## 7. Integrasi Eksternal

### 7.1 SATUSEHAT (Kemenkes)

```javascript
// integration-service/satusehat.service.js
class SatuSehatService {
  
  // Push encounter setelah visit selesai (via BullMQ job)
  async pushEncounter(visitId) {
    const visit = await Visit.findById(visitId).populate('patient doctor branch');
    
    const fhirEncounter = this.mapToFHIR(visit);
    
    const response = await axios.post(
      `${SATUSEHAT_BASE_URL}/Encounter`,
      fhirEncounter,
      { headers: { Authorization: `Bearer ${await this.getAccessToken()}` } }
    );
    
    await Visit.findByIdAndUpdate(visitId, {
      'satuSehatStatus.encounterResourceId': response.data.id,
      'satuSehatStatus.isSynced': true,
      'satuSehatStatus.lastSyncAt': new Date()
    });
  }
  
  mapToFHIR(visit) {
    return {
      resourceType: 'Encounter',
      status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
      subject: { reference: `Patient/${visit.patient.satuSehatId}` },
      participant: [{ individual: { reference: `Practitioner/${visit.doctor.satuSehatId}` } }],
      period: { start: visit.visitDate.toISOString(), end: visit.updatedAt.toISOString() },
      location: [{ location: { reference: `Location/${visit.branch.satuSehatInfo.locationId}` } }],
      diagnosis: visit.assessment.diagnoses.map(d => ({
        condition: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: d.icdCode }] }
      }))
    };
  }
}
```

### 7.2 BPJS PCare

```javascript
// Bridging klaim BPJS via PCare API v2
class BPJSPCareService {
  async submitKunjungan(visitId) {
    const visit = await this.getVisitWithBPJSData(visitId);
    
    const payload = {
      noKartu: visit.patient.insuranceInfo.find(i => i.type === 'BPJS').memberNo,
      tglDaftar: format(visit.visitDate, 'yyyy-MM-dd'),
      providerPelayanan: { kdProvider: visit.branch.bpjsInfo.puskesmasCode },
      // ... mapping lengkap
    };
    
    return await this.pCareClient.post('/kunjungan', payload);
  }
}
```

### 7.3 WhatsApp Notification (via Fonnte/Wablas)

```javascript
// Notifikasi otomatis: konfirmasi booking, jadwal kontrol, stok kritis
class NotificationService {
  async sendBookingConfirmation(patient, visit) {
    const message = `Halo ${patient.personalInfo.name}, kunjungan Anda di ${visit.branch.name} terjadwal pada ${format(visit.visitDate, 'dd MMMM yyyy HH:mm')}. Nomor antrian Anda: ${visit.queueNo}`;
    
    await this.whatsappClient.send({
      target: patient.personalInfo.phone,
      message
    });
  }
}
```

---

## 8. Security Implementation

### 8.1 Enkripsi Data Sensitif

```javascript
// utils/encryption.util.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

exports.encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

exports.decrypt = (encryptedText) => {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
};
```

### 8.2 RBAC (Role-Based Access Control)

```javascript
// middleware/rbac.middleware.js
const permissions = {
  OWNER:         ['*'],                                    // semua akses
  ADMIN_PUSAT:   ['branch:*', 'user:*', 'report:read'],
  ADMIN_CABANG:  ['patient:*', 'visit:*', 'pharmacy:*', 'finance:read'],
  DOKTER:        ['patient:read', 'visit:*', 'prescription:*'],
  APOTEKER:      ['pharmacy:*', 'prescription:read'],
  KASIR:         ['finance:*', 'invoice:*', 'patient:read']
};

const checkPermission = (requiredPermission) => (req, res, next) => {
  const userPerms = permissions[req.user.role.type];
  const hasPermission = userPerms.includes('*') || userPerms.includes(requiredPermission);
  if (!hasPermission) return res.status(403).json({ error: 'Akses ditolak' });
  next();
};
```

### 8.3 Rate Limiting

```javascript
// middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 menit
  max: 300,                    // 300 request per window
  store: new RedisStore({ client: redisClient })
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                     // 10 percobaan login per 15 menit
  message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit'
});
```

---

## 9. MongoDB Indexing Strategy

```javascript
// Indexes penting untuk performa

// patients collection
db.patients.createIndex({ tenantId: 1, medicalRecordNo: 1 }, { unique: true });
db.patients.createIndex({ tenantId: 1, 'personalInfo.nik': 1 });
db.patients.createIndex({ tenantId: 1, 'personalInfo.name': 'text' });

// visits collection
db.visits.createIndex({ tenantId: 1, branchId: 1, visitDate: -1 });
db.visits.createIndex({ tenantId: 1, patientId: 1, visitDate: -1 });
db.visits.createIndex({ tenantId: 1, doctorId: 1, visitDate: -1 });
db.visits.createIndex({ tenantId: 1, status: 1, branchId: 1 });
db.visits.createIndex({ 'satuSehatStatus.isSynced': 1 }); // untuk sync job

// medicines collection
db.medicines.createIndex({ tenantId: 1, branchId: 1 });
db.medicines.createIndex({ tenantId: 1, 'medicine.name': 'text' });
db.medicines.createIndex({ 'batches.expiredDate': 1 }); // untuk alert kadaluarsa

// invoices collection
db.invoices.createIndex({ tenantId: 1, branchId: 1, createdAt: -1 });
db.invoices.createIndex({ tenantId: 1, 'payment.status': 1 });
```

---

## 10. Background Jobs (BullMQ)

```javascript
// Daftar scheduled & triggered jobs

const queues = {
  // Triggered jobs
  'satusehat-sync':     'Push data RME ke SATUSEHAT setelah visit selesai',
  'bpjs-claim':         'Submit klaim BPJS setelah visit selesai',
  'send-notification':  'Kirim WhatsApp/Email notifikasi',
  'stock-deduction':    'Kurangi stok obat setelah resep divalidasi',
  
  // Scheduled jobs (cron)
  'daily-report':       'Generate laporan harian tiap cabang (23:59)',
  'stock-alert':        'Cek stok kritis & kadaluarsa (08:00)',
  'control-reminder':   'Kirim reminder jadwal kontrol pasien (09:00)',
  'sync-failed-retry':  'Retry SATUSEHAT sync yang gagal (setiap 1 jam)',
  'backup-check':       'Validasi backup berhasil (06:00)'
};
```

---

## 11. Deployment Architecture

```
Production Environment (AWS ap-southeast-3 / Jakarta):

┌─────────────────────────────────────────┐
│             CloudFront CDN               │
│         (static assets, web app)         │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Application Load Balancer        │
└──────┬───────────────────────┬──────────┘
       │                       │
┌──────▼──────┐         ┌──────▼──────┐
│  EKS Node   │   ...   │  EKS Node   │
│  (Pod Pool) │         │  (Pod Pool) │
└─────────────┘         └─────────────┘
       │
┌──────▼────────────────────────────────┐
│  MongoDB Atlas M30 (ap-southeast-1)   │
│  - Primary + 2 Replicas               │
│  - Automated Backup 6h                │
│  - Atlas Search enabled               │
└───────────────────────────────────────┘

Staging: ECS Fargate (biaya lebih rendah)
Development: Docker Compose local
```

---

## 12. Environment Variables

```bash
# .env.example

# App
NODE_ENV=production
PORT=3000
API_VERSION=v1

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/klinkhub?retryWrites=true
MONGODB_DB_NAME=klinkhub

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Encryption
ENCRYPTION_KEY=64-char-hex-key-for-aes-256

# SATUSEHAT
SATUSEHAT_BASE_URL=https://api-satusehat.kemkes.go.id/fhir-r4/v1
SATUSEHAT_CLIENT_ID=your-client-id
SATUSEHAT_CLIENT_SECRET=your-client-secret

# BPJS PCare
BPJS_PCARE_URL=https://new-api.bpjs-kesehatan.go.id/api/v1/apotek
BPJS_CONS_ID=your-cons-id
BPJS_SECRET_KEY=your-secret-key

# WhatsApp
FONNTE_TOKEN=your-fonnte-token

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=klinkhub-files
AWS_REGION=ap-southeast-3

# Sentry
SENTRY_DSN=https://your-sentry-dsn
```

---

## 13. Development Setup

```bash
# Prerequisites: Node.js 22+, pnpm, Docker

# 1. Clone & install
git clone https://github.com/your-org/klinkhub.git
cd klinkhub
pnpm install

# 2. Start infrastructure
docker-compose up -d  # MongoDB, Redis

# 3. Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# 4. Seed database
pnpm run seed

# 5. Start semua service (development)
pnpm run dev

# Service URLs:
# Web App:      http://localhost:3000
# API Gateway:  http://localhost:4000
# Auth Service: http://localhost:4001
# RME Service:  http://localhost:4002
# API Docs:     http://localhost:4000/docs
```

---

## 14. CI/CD Pipeline

```yaml
# .github/workflows/main.yml
# Trigger: push ke main branch

Pipeline:
  1. Lint & Type Check (ESLint + TypeScript)
  2. Unit Tests (Jest) — coverage minimum 80%
  3. Integration Tests (Supertest)
  4. Build Docker Images
  5. Push ke ECR (AWS Container Registry)
  6. Deploy ke Staging (auto)
  7. E2E Tests di Staging (Playwright)
  8. Manual approval → Deploy ke Production
  9. Smoke Tests Production
  10. Notify Slack
```

---

*Dokumen ini adalah living document. Update seiring perkembangan arsitektur.*
*Engineering questions: engineering@klinkhub.id*
