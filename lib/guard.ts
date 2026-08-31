import { getSession } from "@/lib/auth";
import { fail } from "@/lib/response";
import type { SessionPayload } from "@/lib/jwt";

export const MANAGE_ROLES = ["OWNER", "ADMIN_PUSAT"];
export const CLINICAL_ROLES = ["OWNER", "ADMIN_PUSAT", "ADMIN_CABANG", "DOKTER", "PERAWAT"];
export const PHARMACY_ROLES = ["OWNER", "ADMIN_PUSAT", "ADMIN_CABANG", "APOTEKER"];
export const CASHIER_ROLES = ["OWNER", "ADMIN_PUSAT", "ADMIN_CABANG", "KASIR"];

type GuardResult = { session: SessionPayload } | { error: ReturnType<typeof fail> };

export async function guard(allowedRoles: string[]): Promise<GuardResult> {
  const session = await getSession();
  if (!session) return { error: fail("UNAUTHORIZED", "Belum login", 401) };
  if (!allowedRoles.includes(session.role)) return { error: fail("FORBIDDEN", "Akses ditolak", 403) };
  return { session };
}

export function isError(result: GuardResult): result is { error: ReturnType<typeof fail> } {
  return "error" in result;
}
