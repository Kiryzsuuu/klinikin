import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { PurchaseOrder } from "@/models/Procurement";
import { Medicine } from "@/models/Medicine";
import { guard, isError, PHARMACY_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const updateSchema = z.object({ status: z.enum(["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"]) });

type Params = { params: Promise<{ id: string }> };

// Saat status jadi RECEIVED, stok obat di cabang tujuan otomatis ditambah/dibuat
export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(PHARMACY_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const po = await PurchaseOrder.findById(id);
  if (!po) return fail("PO_NOT_FOUND", "Purchase order tidak ditemukan", 404);

  const wasReceived = po.status === "RECEIVED";
  po.status = parsed.data.status;

  if (parsed.data.status === "RECEIVED" && !wasReceived) {
    po.receivedAt = new Date();
    for (const item of po.items) {
      const medicine = await Medicine.findOne({ branchId: po.branchId, name: item.medicineName });
      if (medicine) {
        medicine.stock.current += item.quantity;
        await medicine.save();
      } else {
        await Medicine.create({
          branchId: po.branchId,
          name: item.medicineName,
          stock: { current: item.quantity, minimum: 10 },
          pricing: { buyPrice: item.unitPrice, sellPrice: item.unitPrice },
        });
      }
    }
  }

  await po.save();
  return ok(po);
}
