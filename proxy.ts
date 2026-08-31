import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Middleware hanya cek keberadaan cookie (Edge runtime tidak cocok untuk verifikasi JWT
// via jsonwebtoken/Node crypto). Verifikasi penuh + role check dilakukan di setiap
// server component/API route melalui lib/auth.ts.
export function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
