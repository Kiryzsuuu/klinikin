import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Visit, generateVisitNo } from "@/models/Visit";
import { Branch } from "@/models/Branch";
import { guard, isError, CLINICAL_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  branchId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  visitType: z.enum(["RAWAT_JALAN", "RAWAT_INAP", "UGD"]).optional(),
  paymentType: z.enum(["UMUM", "BPJS", "ASURANSI"]).optional(),
});

export async function GET(req: NextRequest) {
  const g = await guard(CLINICAL_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");

  const filter: Record<string, unknown> = {};
  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Visit.find(filter)
      .populate("patientId", "name medicalRecordNo")
      .populate("doctorId", "name")
      .populate("branchId", "name code")
      .sort({ visitDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Visit.countDocuments(filter),
  ]);

  return ok(items, { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const g = await guard(CLINICAL_ROLES);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const branch = await Branch.findById(parsed.data.branchId);
  if (!branch) return fail("BRANCH_NOT_FOUND", "Cabang tidak ditemukan", 404);

  const visitNo = await generateVisitNo(branch.code);
  const visit = await Visit.create({ ...parsed.data, visitNo });
  return ok(visit, { status: 201 });
}
