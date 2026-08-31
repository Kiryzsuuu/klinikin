import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/models/ApiKey";
import { generateApiKey } from "@/lib/apiKeyAuth";
import { guard, isError, MANAGE_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(2),
  scopes: z.array(z.enum(["patients:read", "visits:read", "branches:read"])).min(1),
});

export async function GET() {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  await connectDB();
  const keys = await ApiKey.find({}).select("-keyHash").sort({ createdAt: -1 });
  return ok(keys);
}

// Key asli (raw) hanya dikembalikan sekali di response ini — tidak pernah disimpan/ditampilkan lagi
export async function POST(req: NextRequest) {
  const g = await guard(MANAGE_ROLES);
  if (isError(g)) return g.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  const { raw, keyHash, keyPrefix } = generateApiKey();

  await connectDB();
  await ApiKey.create({
    name: parsed.data.name,
    scopes: parsed.data.scopes,
    keyHash,
    keyPrefix,
    createdBy: g.session.userId,
  });

  return ok({ apiKey: raw, message: "Simpan key ini sekarang — tidak akan ditampilkan lagi." }, { status: 201 });
}
