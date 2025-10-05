// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyPlanCookie, PLAN_COOKIE_NAME } from "@/lib/plan-cookie";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Create SSR supabase bound to req/res cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          // propagate any refresh/access token updates
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // This will refresh/extend cookies if needed and tell us if the user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Plan gating targets
  const url = request.nextUrl;
  const isArbsAPI = url.pathname.startsWith("/api/arbs");
  const isSSE = url.pathname.startsWith("/api/sse/arbs");

  // Auth gate for both arbs APIs
  // allow teaser for unauthenticated
  const isTeaser = url.pathname.startsWith("/api/arbs/teaser");
  if ((isArbsAPI || isSSE) && !user && !isTeaser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  // Pro-only SSE gate using signed plan cookie (fast, DB-free)
  // Hint-only: we no longer hard-block SSE here because local dev may not have the __Host-plan cookie.
  // Route-level DB check in /api/sse/arbs enforces plan authoritatively.

  // Useful for debugging current path downstream (you already had this)
  response.headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
