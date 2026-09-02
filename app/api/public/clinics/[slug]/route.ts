import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { ok, fail } from "@/lib/response";

type Params = { params: Promise<{ slug: string }> };

// Publik: dipakai halaman booking & portal pasien per-klinik (/c/[slug]/...)
// untuk menampilkan nama/logo klinik dan mendapatkan clinicId.
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  await connectDB();

  const clinic = await Clinic.findOne({ slug, isActive: true }).select(
    "name slug logoBase64 contact settings"
  );
  if (!clinic) return fail("CLINIC_NOT_FOUND", "Klinik tidak ditemukan", 404);

  return ok(clinic);
}
