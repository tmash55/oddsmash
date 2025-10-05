import { createClient } from "@/libs/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PLAN_COOKIE_NAME, signPlanCookie } from "@/lib/plan-cookie";

async function mintPlanCookie(supabase: ReturnType<typeof createClient>, userId: string) {
  const secret = process.env.PLAN_COOKIE_SECRET;
  if (!secret) {
    console.warn("PLAN_COOKIE_SECRET missing; skipping plan cookie mint.");
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("profiles.plan load error (defaulting to free):", error.message);
  }

  const plan = ((profile?.plan as string) ?? "free") as "free" | "pro" | "admin";
  const exp = Math.floor(Date.now() / 1000) + 6 * 60 * 60; // 6h

  return await signPlanCookie({ plan, uid: userId, exp }, secret);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/hit-rates";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.nextUrl.origin));
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    console.error("Auth error:", error);
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.nextUrl.origin));
  }

  const user = data.user;

  // Check onboarding status
  const { data: preferences, error: prefError } = await supabase
    .from("user_preferences")
    .select("onboarding_completed, id, preferred_sportsbooks, state_code")
    .eq("id", user.id)
    .maybeSingle();

  if (prefError) {
    console.warn("user_preferences load warning:", prefError.message);
  }

  // Decide redirect target
  let target = new URL(next, request.nextUrl.origin);
  if (!preferences?.onboarding_completed) {
    const userData = {
      email: user.email,
      firstName:
        user.user_metadata?.first_name ||
        user.user_metadata?.full_name?.split(" ")?.[0] ||
        "",
      needsOnboarding: true,
    };
    target = new URL("/onboarding", request.nextUrl.origin);
    target.searchParams.set("userData", JSON.stringify(userData));
  }

  // Mint plan cookie
  const signed = await mintPlanCookie(supabase, user.id);

  const res = NextResponse.redirect(target);
  if (signed) {
    res.cookies.set({
      name: PLAN_COOKIE_NAME, // "__Host-plan"
      value: signed,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      // optional: maxAge: 6 * 60 * 60,
    });
  }
  return res;
}
