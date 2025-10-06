export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { verifyPlanCookie, PLAN_COOKIE_NAME } from "@/lib/plan-cookie";
import { createClient } from "@/libs/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.PLAN_COOKIE_SECRET || "";
    const raw = req.cookies.get(PLAN_COOKIE_NAME)?.value;
    if (raw && secret) {
      const payload = await verifyPlanCookie(raw, secret).catch(() => null);
      if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { plan: payload.plan, source: "cookie" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    // Fallback to DB
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { plan: "free" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    return NextResponse.json(
      { plan: (profile?.plan ?? "free") },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { plan: "free" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}



