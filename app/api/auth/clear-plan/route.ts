import { NextResponse } from "next/server";
import { PLAN_COOKIE_NAME } from "@/lib/plan-cookie";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: PLAN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}


