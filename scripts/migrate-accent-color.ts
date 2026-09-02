import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectDB } from "../lib/db";
import { SiteSettings } from "../models/SiteSettings";
import { Clinic } from "../models/Clinic";

const OLD_COLORS = ["#9EF40B", "#B9E937", "#D9A441", "#57D131"];
const NEW_ACCENT = "#1B686B";

// Ganti semua warna aksen lama (lime neon, amber, green lama) jadi satu warna
// tunggal #1B686B di data yang sudah tersimpan. Hanya menimpa dokumen yang
// masih pakai salah satu default lama, tidak menimpa warna yang sudah sengaja
// dikustomisasi admin ke warna lain.
async function main() {
  await connectDB();

  for (const field of ["theme.primaryColor", "theme.secondaryColor"]) {
    const siteRes = await SiteSettings.updateMany(
      { [field]: { $in: OLD_COLORS } },
      { $set: { [field]: NEW_ACCENT } }
    );
    console.log(`SiteSettings.${field} diperbarui: ${siteRes.modifiedCount}`);
  }

  for (const field of ["settings.theme.primaryColor", "settings.theme.secondaryColor"]) {
    const clinicRes = await Clinic.updateMany(
      { [field]: { $in: OLD_COLORS } },
      { $set: { [field]: NEW_ACCENT } }
    );
    console.log(`Clinic.${field} diperbarui: ${clinicRes.modifiedCount}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
