import { NextResponse } from "next/server";

export function ok(data: unknown, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json(
    { success: true, data, ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200 }
  );
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}
