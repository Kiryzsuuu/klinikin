import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectDB } from "../lib/db";
import { SubscriptionPlan } from "../models/SubscriptionPlan";

// Fitur premium diperluas dari 5 key ke 8 key (tambah lab/hr/accreditation). Skrip ini
// menaikkan paket default (starter/pro/enterprise) yang MASIH memakai salah satu bentuk lama —
// baik teks marketing bebas dari sebelum migrasi pertama, atau 5-key hasil migrasi pertama —
// ke default baru. Paket yang sudah dikustomisasi manual lewat UI (kombinasi fitur lain) TIDAK
// disentuh sama sekali.
const OLD_MARKETING_TEXT = new Set([
  "1 Cabang", "RME Dasar", "Kasir & Invoice", "Booking Online",
  "5 Cabang", "Semua fitur Starter", "Asisten AI", "Procurement & Asuransi", "Export Laporan",
  "Cabang tanpa batas", "Semua fitur Pro", "API Publik", "Dukungan prioritas",
]);

const PREVIOUS_MIGRATION: Record<string, string[]> = {
  starter: [],
  pro: ["ai", "procurement", "insurance", "export"],
  enterprise: ["ai", "procurement", "insurance", "export", "api-keys"],
};

const CORE = ["patients", "pharmacy", "cashier", "booking"];
const NEW_DEFAULTS: Record<string, string[]> = {
  starter: CORE,
  pro: [...CORE, "lab", "hr", "accreditation", "ai", "procurement", "insurance", "export"],
  enterprise: [...CORE, "lab", "hr", "accreditation", "ai", "procurement", "insurance", "export", "api-keys"],
};

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

async function main() {
  await connectDB();

  let updated = 0;
  for (const slug of Object.keys(NEW_DEFAULTS)) {
    const plan = await SubscriptionPlan.findOne({ slug });
    if (!plan) continue;

    const current: string[] = plan.features;
    const isOldMarketing = current.some((f) => OLD_MARKETING_TEXT.has(f));
    const isPreviousMigration = sameSet(current, PREVIOUS_MIGRATION[slug]);
    if (!isOldMarketing && !isPreviousMigration) {
      console.log(`Lewati "${slug}" — sudah dikustomisasi manual: [${current.join(", ") || "-"}]`);
      continue;
    }

    plan.features = NEW_DEFAULTS[slug];
    await plan.save();
    updated += 1;
    console.log(`Paket "${slug}" diperbarui ke fitur: [${NEW_DEFAULTS[slug].join(", ") || "-"}]`);
  }

  console.log(`Selesai. Paket diperbarui: ${updated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
