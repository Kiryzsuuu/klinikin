import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Visit } from "@/models/Visit";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";
import { audit } from "@/lib/audit";

const updateSchema = z.object({
  status: z.enum(["WAITING", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  subjective: z.string().optional(),
  objective: z.object({}).passthrough().optional(),
  assessment: z.object({}).passthrough().optional(),
  plan: z.object({}).passthrough().optional(),
  dentalChart: z.array(z.object({}).passthrough()).optional(),
  skinChart: z.array(z.object({}).passthrough()).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  const { id } = await params;
  await connectDB();
  const visit = await Visit.findOne({ _id: id, ...clinicFilter })
    .populate("patientId")
    .populate("doctorId", "name")
    .populate("branchId", "name code");
  if (!visit) return fail("VISIT_NOT_FOUND", "Kunjungan tidak ditemukan", 404);
  return ok(visit);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const visit = await Visit.findOneAndUpdate({ _id: id, ...clinicFilter }, parsed.data, { new: true });
  if (!visit) return fail("VISIT_NOT_FOUND", "Kunjungan tidak ditemukan", 404);
  await audit(session, "VISIT_UPDATE", "Visit", id, req, { fields: Object.keys(parsed.data) });
  return ok(visit);
}
