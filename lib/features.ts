// Daftar tunggal & global modul/fitur yang bisa dikunci-buka per paket langganan (lewat
// SubscriptionPlan.features) DAN per role staf dalam satu klinik (lewat
// Clinic.settings.rolePermissions). Setiap key di sini harus punya pengecekan requireFeature()
// yang cocok di route API-nya (lihat lib/tenant.ts) — menambah entri di sini saja tidak
// otomatis menggerbang apa pun.
export const FEATURE_KEYS = [
  { key: "patients", label: "Data Pasien / RME" },
  { key: "pharmacy", label: "Farmasi & Stok" },
  { key: "cashier", label: "Kasir & Invoice" },
  { key: "booking", label: "Booking Pasien" },
  { key: "lab", label: "Lab & Radiologi" },
  { key: "hr", label: "SDM & Jadwal" },
  { key: "accreditation", label: "Akreditasi" },
  { key: "ai", label: "Asisten AI" },
  { key: "procurement", label: "Procurement Obat" },
  { key: "insurance", label: "Asuransi Swasta" },
  { key: "export", label: "Export Laporan (CSV)" },
  { key: "api-keys", label: "API Publik" },
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number]["key"];

export const FEATURE_KEY_VALUES = FEATURE_KEYS.map((f) => f.key) as [FeatureKey, ...FeatureKey[]];

export const FEATURE_LABELS: Record<string, string> = Object.fromEntries(
  FEATURE_KEYS.map((f) => [f.key, f.label])
);

// Modul inti yang selalu terbuka untuk trial (demonstrasi produk) dan tidak digerbang oleh
// pilihan paket sama sekali — hanya modul "ekstra" di bawah ini yang mengikuti paket.
export const CORE_FEATURES: FeatureKey[] = ["patients", "pharmacy", "cashier", "booking"];

// Fitur yang terkunci khusus selama masa TRIAL (dibuka penuh begitu berlangganan, lalu
// mengikuti fitur paket masing-masing).
export const TRIAL_DISABLED_FEATURES: FeatureKey[] = FEATURE_KEY_VALUES.filter(
  (k) => !CORE_FEATURES.includes(k)
);

// Role staf non-admin yang aksesnya bisa dikustomisasi per klinik lewat rolePermissions.
// OWNER & ADMIN_PUSAT selalu full akses (pemilik/admin utama klinik), tidak dibatasi di sini.
export const CONFIGURABLE_ROLES = ["ADMIN_CABANG", "DOKTER", "PERAWAT", "APOTEKER", "KASIR"] as const;
export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number];

// Default akses per role sebelum klinik mengustomisasi rolePermissions sendiri — dipilih
// supaya perilaku tidak berubah dari sebelumnya (role klinis dapat modul klinis, apoteker
// dapat farmasi, kasir dapat kasir, dst).
export const DEFAULT_ROLE_FEATURES: Record<ConfigurableRole, FeatureKey[]> = {
  ADMIN_CABANG: [...FEATURE_KEY_VALUES],
  DOKTER: ["patients", "pharmacy", "booking", "lab", "ai"],
  PERAWAT: ["patients", "booking", "lab"],
  APOTEKER: ["pharmacy", "procurement"],
  KASIR: ["cashier", "booking", "insurance"],
};
