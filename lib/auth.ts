import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "@/lib/jwt";

export const SESSION_COOKIE = "klinikhub_session";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export function requireRole(session: SessionPayload, allowed: string[]) {
  if (!allowed.includes(session.role)) throw new Error("FORBIDDEN");
}
