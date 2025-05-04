import { Client } from "@upstash/qstash";
import { NextResponse } from "next/server";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN!;
const client = new Client({ token: QSTASH_TOKEN });
const POLLING_ENDPOINT = "https://oddsmash.io/api/cron/mlb/cache"; // replace with prod

export async function GET() {
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

    const firstGame = games.reduce((a:any, b:any) =>
      new Date(a.gameDate) < new Date(b.gameDate) ? a : b
    );
    const lastGame = games.reduce((a:any, b:any) =>
      new Date(a.gameDate) > new Date(b.gameDate) ? a : b
    );

    const firstStart = new Date(firstGame.gameDate);
    const lastStart = new Date(lastGame.gameDate);
    const now = new Date();

    const delayMs = Math.max(0, firstStart.getTime() - now.getTime() - 60 * 60 * 1000); // 1 hour before first pitch
    const expiresAt = new Date(lastStart.getTime() + 4.5 * 60 * 60 * 1000); // 4.5 hrs after last game starts

    const result = await client.publishJSON({
        url: POLLING_ENDPOINT,
        body: { reason: "hour-before-first-pitch" },
        delay: delayMs,
        cron: "*/5 * * * *",
        notBefore: Date.now() + delayMs, // ✅ use number (ms)
        expiresAt: expiresAt.getTime(), // ✅ convert Date to ms
      });
      

    return NextResponse.json({
      message: "Polling job scheduled",
      delayMinutes: Math.floor(delayMs / 60000),
      firstGameTime: firstStart,
      lastGameTime: lastStart,
      expiresAt,
      qstashMessageId: result.messageId,
    });
  } catch (error) {
    console.error("Error setting up polling schedule:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
