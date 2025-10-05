import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 })
    }

    const raw = await redis.get<any>(key)
    let value = raw
    if (typeof raw === "string") {
      try {
        value = JSON.parse(raw)
      } catch {
        value = raw
      }
    }

    return NextResponse.json({ key, value })
  } catch (error) {
    console.error("[API] Redis GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



