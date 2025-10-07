import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const H_ALT = "props:rows:alt";

export async function GET(_req: NextRequest, { params }: { params: { sid: string } }) {
  try {
    const sid = (params?.sid || "").trim();
    if (!sid) return NextResponse.json({ error: "sid_required" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const raw = await (redis as any).hget(H_ALT, sid);
    let family: any = null;
    if (raw) {
      if (typeof raw === "string") { try { family = JSON.parse(raw); } catch { family = null; } }
      else if (typeof raw === "object") family = raw;
    }

    return NextResponse.json({ family }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json(
      { error: "internal_error", message: error?.message || "" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}


