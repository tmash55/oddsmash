import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN!;
const client = new Client({ token: QSTASH_TOKEN });

const POLLING_ENDPOINT = "https://www.oddsmash.io/api/cron/mlb/cache";

export async function GET(req: Request) {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const scheduleRes = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}`);
    const scheduleData = await scheduleRes.json();

    const games = scheduleData?.dates?.[0]?.games || [];
    if (games.length === 0) {
      return NextResponse.json({ message: "No games today" });
    }

    const firstGame = games.reduce((a: any, b: any) =>
      new Date(a.gameDate) < new Date(b.gameDate) ? a : b
    );
    const firstStart = new Date(firstGame.gameDate);
    const now = new Date();

    const delayMs = Math.max(0, firstStart.getTime() - now.getTime() - 60 * 60 * 1000); // 1 hour before first pitch
    const notBefore = Date.now() + delayMs;

    // Set expiresAt to 11:59 PM ET (04:59 UTC next day)
    const expires = new Date();
    expires.setUTCHours(4, 59, 0, 0);
    if (expires.getTime() < notBefore) {
      expires.setDate(expires.getDate() + 1); // Make sure it's in the future
    }

    const result = await client.publishJSON({
      url: POLLING_ENDPOINT,
      body: { reason: "hour-before-first-pitch" },
      delay: delayMs,
      cron: "*/5 * * * *",
      notBefore,
      expiresAt: expires.getTime(),
    });

    return NextResponse.json({
      message: "Polling job scheduled (fixed end time)",
      delayMinutes: Math.floor(delayMs / 60000),
      firstGameTime: firstStart,
      expiresAt: expires,
      qstashMessageId: result.messageId,
    });
  } catch (error) {
    console.error("Error setting up polling schedule:", error);
    return NextResponse.json(
      { error: "Internal error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
