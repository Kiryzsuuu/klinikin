import crypto from "crypto";
import { ApiKey } from "@/models/ApiKey";

// API key format: kh_live_<32 hex chars>. Hanya hash-nya (SHA-256) yang disimpan di DB.
export function generateApiKey() {
  const raw = `kh_live_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = hashKey(raw);
  const keyPrefix = raw.slice(0, 12);
  return { raw, keyHash, keyPrefix };
}

export function hashKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function verifyApiKey(raw: string | null, requiredScope: string) {
  if (!raw) return { ok: false as const, status: 401, message: "Header X-API-Key wajib diisi" };

  const keyHash = hashKey(raw);
  const apiKey = await ApiKey.findOne({ keyHash, isActive: true });
  if (!apiKey) return { ok: false as const, status: 401, message: "API key tidak valid" };
  if (!apiKey.scopes.includes(requiredScope)) {
    return { ok: false as const, status: 403, message: `API key tidak punya scope '${requiredScope}'` };
  }

  apiKey.lastUsedAt = new Date();
  await apiKey.save();

  return { ok: true as const, clinicId: String(apiKey.clinicId) };
}
