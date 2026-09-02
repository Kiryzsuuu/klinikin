// Daftar tunggal & global fitur premium yang bisa dikunci/dibuka per paket langganan.
// Setiap key di sini harus punya pengecekan requireFeature() yang cocok di route API-nya
// (lihat lib/tenant.ts) — menambah entri di sini saja tidak otomatis menggerbang apa pun.
export const FEATURE_KEYS = [
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
