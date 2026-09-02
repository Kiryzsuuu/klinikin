import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectDB } from "../lib/db";
import { SiteSettings } from "../models/SiteSettings";
import { Clinic } from "../models/Clinic";

const OLD_LIME = ["#9EF40B", "#B9E937"];
const NEW_ACCENT = "#D9A441";

// Ganti warna aksen "lime" neon lama jadi amber di data yang sudah tersimpan.
// Hanya menimpa dokumen yang masih pakai default lama, tidak menimpa warna
// yang sudah sengaja dikustomisasi admin ke warna lain.
async function main() {
  await connectDB();

  const siteRes = await SiteSettings.updateMany(
    { "theme.secondaryColor": { $in: OLD_LIME } },
    { $set: { "theme.secondaryColor": NEW_ACCENT } }
  );
  console.log(`SiteSettings diperbarui: ${siteRes.modifiedCount}`);

  const clinicRes = await Clinic.updateMany(
    { "settings.theme.secondaryColor": { $in: OLD_LIME } },
    { $set: { "settings.theme.secondaryColor": NEW_ACCENT } }
  );
  console.log(`Clinic diperbarui: ${clinicRes.modifiedCount}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
