// /app/api/cron/mlb/polling/route.ts
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN!;
const client = new Client({ token: QSTASH_TOKEN });

const POLLING_ENDPOINT = "https://yourdomain.com/api/cron/mlb/cache"; // replace with your prod domain

export async function GET() {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const scheduleRes = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}`);
    const scheduleData = await scheduleRes.json();

    if (!scheduleData.dates?.[0]?.games?.length) {
      return NextResponse.json({ message: "No games today" });
    }

    const games = scheduleData.dates[0].games;
    const earliestGame = games.reduce((earliest: any, current: any) =>
      new Date(current.gameDate) < new Date(earliest.gameDate) ? current : earliest
    );

    const gameStart = new Date(earliestGame.gameDate);
    const now = new Date();
    const delayMs = Math.max(0, gameStart.getTime() - now.getTime() - 60 * 60 * 1000);

    // Schedule a polling job using the QStash SDK
    const result = await client.publishJSON({
      url: POLLING_ENDPOINT,
      body: { type: "poll-today" },
      delay: delayMs, // ms from now
      cron: "*/5 * * * *", // every 5 minutes
    });

    return NextResponse.json({
      message: "Polling job scheduled",
      delayMinutes: Math.floor(delayMs / 60000),
      qstashMessageId: result.messageId,
    });
  } catch (error) {
    console.error("Error setting up polling schedule:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
