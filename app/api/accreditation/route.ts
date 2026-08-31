import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { AccreditationItem } from "@/models/Accreditation";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  branchId: z.string(),
  category: z.string().min(2),
  item: z.string().min(2),
});

export async function GET(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const filter: Record<string, unknown> = {};
  if (branchId) filter.branchId = branchId;

  const items = await AccreditationItem.find(filter).populate("branchId", "name").sort({ category: 1 });
  return ok(items);
}

export async function POST(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();
  const item = await AccreditationItem.create(parsed.data);
  return ok(item, { status: 201 });
}
