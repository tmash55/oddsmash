import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { PLAN_COOKIE_NAME, signPlanCookie, verifyPlanCookie } from "@/lib/plan-cookie";

/**
 * POST /api/auth/refresh-plan?onlyIfExpLt=3600
 * - onlyIfExpLt (seconds): only re-mint if cookie expires in < this window
 */
export async function POST(req: NextRequest) {
  // --- Optional CSRF/same-origin guard ---
  const origin = req.headers.get("origin");
  const expected = new URL(req.url).origin;
  if (origin && origin !== expected) {
    return NextResponse.json({ error: "bad_origin" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  // Optional: only refresh if cookie is nearing expiry
  const onlyIfExpLtSec = Number(new URL(req.url).searchParams.get("onlyIfExpLt") || 0);
  if (Number.isFinite(onlyIfExpLtSec) && onlyIfExpLtSec > 0) {
    const raw = req.cookies.get(PLAN_COOKIE_NAME)?.value;
    const secret = process.env.PLAN_COOKIE_SECRET!;
    const cookie = raw && secret ? await verifyPlanCookie(raw, secret) : null;
    if (cookie?.exp) {
      const now = Math.floor(Date.now() / 1000);
      const secsLeft = cookie.exp - now;
      if (secsLeft > onlyIfExpLtSec) {
        return NextResponse.json(
          { ok: true, skipped: true, reason: "not_close_to_expiry", plan: cookie.plan, exp: cookie.exp, secsLeft },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    }
  }

  // Authoritative plan from DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = ((profile?.plan as string) ?? "free") as "free" | "pro" | "admin";

  const secret = process.env.PLAN_COOKIE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "server_misconfigured", message: "PLAN_COOKIE_SECRET missing" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const exp = Math.floor(Date.now() / 1000) + 6 * 60 * 60; // 6h
  const signed = await signPlanCookie({ plan, uid: user.id, exp }, secret);

  const res = NextResponse.json({ ok: true, plan, exp }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set({
    name: PLAN_COOKIE_NAME, // "__Host-plan"
    value: signed,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 6 * 60 * 60, // optional: align browser TTL with exp
  });
  return res;
}
