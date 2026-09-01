import { AuditLog } from "@/models/AuditLog";
import type { SessionPayload } from "@/lib/jwt";
import type { NextRequest } from "next/server";

export async function audit(
  session: SessionPayload,
  action: string,
  resourceType: string,
  resourceId: string,
  req?: NextRequest,
  metadata?: Record<string, unknown>
) {
  try {
    await AuditLog.create({
      userId: session.userId,
      userEmail: session.email,
      action,
      resourceType,
      resourceId,
      method: req?.method || "",
      path: req ? new URL(req.url).pathname : "",
      ip: req?.headers.get("x-forwarded-for") || "",
      metadata,
    });
  } catch {
    // audit log tidak boleh menggagalkan operasi utama
  }
}
