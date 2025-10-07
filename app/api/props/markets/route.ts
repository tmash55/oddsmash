import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Optional convenience: read a cached list if present, else fallback to a static starter list
const IDX_KEY = "idx:nfl:props:markets";
const STATIC_MARKETS = [
  "passing_yards",
  "rushing_yards",
  "receiving_yards",
  "receptions",
  "points",
  "rebounds",
  "assists",
  "spread",
  "moneyline",
  "total_points",
];

export async function GET() {
  try {
    const raw = await redis.get<string | string[]>(IDX_KEY);
    let markets: string[] | null = null;
    if (raw) {
      if (typeof raw === "string") {
        try { markets = JSON.parse(raw); } catch { markets = null; }
      } else if (Array.isArray(raw)) markets = raw as string[];
    }
    return NextResponse.json({ markets: markets || STATIC_MARKETS }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch {
    return NextResponse.json({ markets: STATIC_MARKETS }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  }
}


