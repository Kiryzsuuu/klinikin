import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Medicine } from "@/models/Medicine";
import { guard, isError, PHARMACY_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const schema = z.object({
  batchNo: z.string().min(1),
  expiredDate: z.string(),
  quantity: z.number().positive(),
});

type Params = { params: Promise<{ id: string }> };

// Tambah batch baru (mis. setelah barang diterima) — otomatis menambah stok total & terekam
// untuk alert kadaluarsa
export async function POST(req: NextRequest, { params }: Params) {
  const g = await guard(PHARMACY_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const medicine = await Medicine.findById(id);
  if (!medicine) return fail("MEDICINE_NOT_FOUND", "Obat tidak ditemukan", 404);

  medicine.batches.push(parsed.data);
  medicine.stock.current += parsed.data.quantity;
  await medicine.save();

  return ok(medicine);
}
