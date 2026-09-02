import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectDB } from "../lib/db";
import { SubscriptionPlan } from "../models/SubscriptionPlan";

// Paket "features" dulu berisi teks marketing bebas (mis. "Asisten AI", "Procurement & Asuransi").
// requireFeature() sekarang membandingkan langsung ke feature key (mis. "ai", "procurement") dari
// lib/features.ts, jadi paket default lama perlu dipetakan ke key yang benar supaya klinik yang
// sudah berlangganan Pro/Enterprise tidak mendadak kehilangan akses fitur yang sudah mereka bayar.
// Hanya menyentuh paket dengan slug default (starter/pro/enterprise) yang masih pakai teks lama —
// paket custom yang sudah diedit lewat UI tidak disentuh.
const SLUG_FEATURE_MAP: Record<string, string[]> = {
  starter: [],
  pro: ["ai", "procurement", "insurance", "export"],
  enterprise: ["ai", "procurement", "insurance", "export", "api-keys"],
};

const KNOWN_KEYS = new Set(["ai", "procurement", "insurance", "export", "api-keys"]);

async function main() {
  await connectDB();

  let updated = 0;
  for (const [slug, features] of Object.entries(SLUG_FEATURE_MAP)) {
    const plan = await SubscriptionPlan.findOne({ slug });
    if (!plan) continue;

    const alreadyMigrated = plan.features.every((f: string) => KNOWN_KEYS.has(f));
    if (alreadyMigrated) continue;

    plan.features = features;
    await plan.save();
    updated += 1;
    console.log(`Paket "${slug}" diperbarui ke fitur: [${features.join(", ") || "-"}]`);
  }

  console.log(`Selesai. Paket diperbarui: ${updated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
