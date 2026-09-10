import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * The workspace is only shown once somebody has been chosen on the sign-in screen.
 * This is a démonstration gate, not security: there is no password behind it and no
 * database. It exists so the client can see that roles are real and that people see
 * different things.
 */
export function middleware(request: NextRequest) {
  const chosen = request.cookies.get(SESSION_COOKIE)?.value;
  if (chosen) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/orders/:path*", "/products/:path*", "/upsells/:path*",
    "/statistics/:path*", "/calculator/:path*", "/budget/:path*", "/team/:path*",
    "/store/:path*", "/inbox/:path*", "/contacts/:path*", "/pipeline/:path*",
    "/tasks/:path*", "/intégrations/:path*", "/settings/:path*", "/help/:path*",
  ],
};
