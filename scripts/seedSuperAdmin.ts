import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { User } from "../models/User";

async function main() {
  await connectDB();

  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  const name = process.env.SEED_SUPERADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.error("SEED_SUPERADMIN_EMAIL / SEED_SUPERADMIN_PASSWORD belum diisi di .env.local");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Super admin sudah ada: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    clinicId: null,
    name,
    email,
    passwordHash,
    role: "SUPER_ADMIN",
    isActive: true,
    isEmailVerified: true,
  });

  console.log(`Super admin dibuat: ${email} / ${password}`);
  console.log("Segera login lalu ganti password melalui menu profil.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
