import { NextRequest } from "next/server";

// Vercel Cron mengirim header Authorization: Bearer <CRON_SECRET> secara otomatis
// jika env var CRON_SECRET diset di project. Cek manual di sini agar endpoint tidak
// bisa dipicu publik oleh siapa pun.
export function verifyCronSecret(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
