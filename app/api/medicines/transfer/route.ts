import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Medicine, StockTransfer } from "@/models/Medicine";
import { PHARMACY_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  medicineId: z.string(),
  toBranchId: z.string(),
  quantity: z.number().positive(),
  note: z.string().optional(),
});

// Transfer stok antar cabang: kurangi stok cabang asal, tambah/buat entri di cabang tujuan
export async function POST(req: NextRequest) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;
  const featureError = await requireFeature(session, "pharmacy");
  if (featureError) return featureError;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { medicineId, toBranchId, quantity, note } = parsed.data;
  await connectDB();

  const source = await Medicine.findOne({ _id: medicineId, ...clinicFilter });
  if (!source) return fail("MEDICINE_NOT_FOUND", "Obat tidak ditemukan", 404);
  if (source.stock.current < quantity) return fail("INSUFFICIENT_STOCK", "Stok tidak mencukupi", 400);
  if (String(source.branchId) === toBranchId) return fail("SAME_BRANCH", "Cabang tujuan sama dengan asal", 400);

  source.stock.current -= quantity;
  await source.save();

  let target = await Medicine.findOne({ branchId: toBranchId, name: source.name, ...clinicFilter });
  if (target) {
    target.stock.current += quantity;
    await target.save();
  } else {
    target = await Medicine.create({
      branchId: toBranchId,
      name: source.name,
      genericName: source.genericName,
      category: source.category,
      unit: source.unit,
      stock: { current: quantity, minimum: source.stock.minimum },
      pricing: source.pricing,
      clinicId: session.clinicId,
    });
  }

  await StockTransfer.create({
    medicineName: source.name,
    fromBranchId: source.branchId,
    toBranchId,
    quantity,
    note,
    transferredBy: session.userId,
    clinicId: session.clinicId,
  });

  return ok({ source, target });
}
