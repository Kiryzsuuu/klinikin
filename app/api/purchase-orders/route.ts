import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { PurchaseOrder, generatePoNo } from "@/models/Procurement";
import { PHARMACY_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const itemSchema = z.object({ medicineName: z.string(), quantity: z.number().positive(), unitPrice: z.number().min(0) });

const createSchema = z.object({
  branchId: z.string(),
  supplierId: z.string(),
  items: z.array(itemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const filter: Record<string, unknown> = { ...clinicFilter };
  if (branchId) filter.branchId = branchId;

  const orders = await PurchaseOrder.find(filter)
    .populate("supplierId", "name")
    .populate("branchId", "name")
    .sort({ createdAt: -1 });

  return ok(orders);
}

export async function POST(req: NextRequest) {
  const g = await scopedGuard(PHARMACY_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { branchId, supplierId, items } = parsed.data;
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  if (!session.clinicId) return fail("CLINIC_REQUIRED", "Akun ini tidak terhubung ke klinik", 400);

  await connectDB();
  const poNo = await generatePoNo(session.clinicId);
  const po = await PurchaseOrder.create({
    branchId,
    supplierId,
    poNo,
    items,
    total,
    status: "DRAFT",
    orderedBy: session.userId,
    clinicId: session.clinicId,
  });

  return ok(po, { status: 201 });
}
