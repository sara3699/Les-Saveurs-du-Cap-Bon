import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/session";

/**
 * Two jobs on every request into the workspace. Keep a signed in session fresh,
 * which Supabase does by rotating a cookie, and send anyone who is neither signed
 * in nor holding a demonstration choice back to the door.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let signedIn = false;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items) {
          for (const { name, value } of items) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of items) response.cookies.set(name, value, options);
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  if (signedIn || request.cookies.get(DEMO_COOKIE)?.value) return response;

  const back = request.nextUrl.clone();
  back.pathname = "/connexion";
  return NextResponse.redirect(back);
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/orders/:path*", "/products/:path*", "/upsells/:path*",
    "/statistics/:path*", "/calculator/:path*", "/budget/:path*", "/team/:path*",
    "/store/:path*", "/inbox/:path*", "/contacts/:path*", "/pipeline/:path*",
    "/tasks/:path*", "/integrations/:path*", "/settings/:path*", "/help/:path*",
  ],
};
