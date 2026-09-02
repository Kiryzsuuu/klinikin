import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/models/ApiKey";
import { generateApiKey } from "@/lib/apiKeyAuth";
import { MANAGE_ROLES } from "@/lib/guard";
import { scopedGuard, isError, requireFeature } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(2),
  scopes: z.array(z.enum(["patients:read", "visits:read", "branches:read"])).min(1),
});

export async function GET() {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session: sessionGet, clinicFilter } = g;
  const featureErrorGet = await requireFeature(sessionGet, "api-keys");
  if (featureErrorGet) return featureErrorGet;

  await connectDB();
  const keys = await ApiKey.find({ ...clinicFilter }).select("-keyHash").sort({ createdAt: -1 });
  return ok(keys);
}

// Key asli (raw) hanya dikembalikan sekali di response ini: tidak pernah disimpan/ditampilkan lagi
export async function POST(req: NextRequest) {
  const g = await scopedGuard(MANAGE_ROLES);
  if (isError(g)) return g.error;
  const { session } = g;
  const featureError = await requireFeature(session, "api-keys");
  if (featureError) return featureError;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { raw, keyHash, keyPrefix } = generateApiKey();

  await connectDB();
  const created = await ApiKey.create({
    name: parsed.data.name,
    scopes: parsed.data.scopes,
    keyHash,
    keyPrefix,
    createdBy: session.userId,
    clinicId: session.clinicId,
  });

  await audit(session, "API_KEY_CREATE", "ApiKey", String(created._id), req, { scopes: parsed.data.scopes });
  return ok({ apiKey: raw, message: "Simpan key ini sekarang, tidak akan ditampilkan lagi." }, { status: 201 });
}
