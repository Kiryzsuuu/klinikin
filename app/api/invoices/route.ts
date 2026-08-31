import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Invoice, generateInvoiceNo } from "@/models/Invoice";
import { Branch } from "@/models/Branch";
import { guard, isError, CASHIER_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const itemSchema = z.object({
  type: z.enum(["CONSULTATION", "MEDICINE", "PROCEDURE", "LAB", "OTHER"]),
  name: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const createSchema = z.object({
  branchId: z.string(),
  patientId: z.string(),
  visitId: z.string().optional(),
  items: z.array(itemSchema).min(1),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  payment: z.object({ method: z.enum(["CASH", "TRANSFER", "QRIS", "BPJS", "INSURANCE"]) }).optional(),
});

export async function GET(req: NextRequest) {
  const g = await guard(CASHIER_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));
  const branchId = searchParams.get("branchId");

  const filter: Record<string, unknown> = {};
  if (branchId) filter.branchId = branchId;

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate("patientId", "name medicalRecordNo")
      .populate("branchId", "name code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return ok(items, { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const g = await guard(CASHIER_ROLES);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { branchId, patientId, visitId, items, discount = 0, tax = 0, payment } = parsed.data;
  await connectDB();

  const branch = await Branch.findById(branchId);
  if (!branch) return fail("BRANCH_NOT_FOUND", "Cabang tidak ditemukan", 404);

  const itemsWithSubtotal = items.map((i) => ({ ...i, subtotal: i.quantity * i.unitPrice }));
  const subtotal = itemsWithSubtotal.reduce((sum, i) => sum + i.subtotal, 0);
  const total = subtotal - discount + tax;

  const invoiceNo = await generateInvoiceNo(branch.code);
  const invoice = await Invoice.create({
    branchId,
    patientId,
    visitId,
    invoiceNo,
    items: itemsWithSubtotal,
    subtotal,
    discount,
    tax,
    total,
    payment: { method: payment?.method || "CASH", status: "UNPAID" },
    cashierId: g.session.userId,
  });

  return ok(invoice, { status: 201 });
}
