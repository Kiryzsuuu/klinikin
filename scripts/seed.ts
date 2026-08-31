import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { User } from "../models/User";
import { getOrCreateSettings } from "../models/SiteSettings";

async function main() {
  await connectDB();
  await getOrCreateSettings();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@klinikhub.id";
  const password = process.env.SEED_ADMIN_PASSWORD || "UbahPasswordIni123!";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin sudah ada: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    passwordHash,
    role: "OWNER",
    isActive: true,
    isEmailVerified: true,
  });

  console.log(`Admin dibuat: ${email} / ${password}`);
  console.log("Segera login lalu ganti password melalui menu Manajemen User.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
