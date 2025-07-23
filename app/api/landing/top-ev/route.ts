import { redis } from "@/lib/redis"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const data = await redis.get("landing:top_ev")
    
    if (!data) {
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching top EV plays:", error)
    return NextResponse.json({ error: "Failed to fetch top EV plays" }, { status: 500 })
  }
} 