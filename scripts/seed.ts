import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { User } from "../models/User";
import { getOrCreateSettings } from "../models/SiteSettings";
import { SubscriptionPlan } from "../models/SubscriptionPlan";
import { createTrialClinic } from "../lib/tenant";

const DEFAULT_PLANS = [
  { name: "Starter", slug: "starter", priceMonthly: 299000, maxBranches: 1, maxUsers: 5, features: ["1 Cabang", "RME Dasar", "Kasir & Invoice", "Booking Online"] },
  { name: "Pro", slug: "pro", priceMonthly: 799000, maxBranches: 5, maxUsers: 25, features: ["5 Cabang", "Semua fitur Starter", "Asisten AI", "Procurement & Asuransi", "Export Laporan"] },
  { name: "Enterprise", slug: "enterprise", priceMonthly: 1999000, maxBranches: 999, maxUsers: 999, features: ["Cabang tanpa batas", "Semua fitur Pro", "API Publik", "Dukungan prioritas"] },
];

async function main() {
  await connectDB();
  await getOrCreateSettings();

  for (const plan of DEFAULT_PLANS) {
    await SubscriptionPlan.findOneAndUpdate({ slug: plan.slug }, plan, { upsert: true });
  }
  console.log("Paket langganan default sudah disiapkan.");

  const email = process.env.SEED_ADMIN_EMAIL || "demo@klinikkita.id";
  const password = process.env.SEED_ADMIN_PASSWORD || "UbahPasswordIni123!";
  const name = process.env.SEED_ADMIN_NAME || "Demo Owner";
  const clinicName = process.env.SEED_CLINIC_NAME || "Klinik Demo";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin demo sudah ada: ${email}`);
    process.exit(0);
  }

  const clinic = await createTrialClinic(clinicName, email);

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    clinicId: clinic._id,
    name,
    email,
    passwordHash,
    role: "OWNER",
    isActive: true,
    isEmailVerified: true,
  });

  console.log(`Klinik demo dibuat: ${clinicName} (${clinic.slug})`);
  console.log(`Admin demo dibuat: ${email} / ${password}`);
  console.log("Segera login lalu ganti password melalui menu Manajemen User.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
