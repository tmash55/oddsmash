// /app/api/cron/mlb/polling/route.ts
import { NextResponse } from "next/server";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN!;
const QSTASH_ENDPOINT = "https://qstash.upstash.io/v1/publish";
const POLLING_ENDPOINT = "https://oddsmash.io/api/cron/mlb/cache"; // replace with your real endpoint

export async function GET() {
  try {
    // Get today's date string
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Step 1: Fetch today's MLB schedule
    const scheduleRes = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}`);
    const scheduleData = await scheduleRes.json();

    if (!scheduleData.dates?.[0]?.games?.length) {
      return NextResponse.json({ message: "No games today" });
    }

    // Step 2: Find the earliest game start
    const games = scheduleData.dates[0].games;
    const earliestGame = games.reduce((earliest:any, current:any) => {
      return new Date(current.gameDate) < new Date(earliest.gameDate) ? current : earliest;
    });

    const gameStart = new Date(earliestGame.gameDate);
    const now = new Date();

    // Step 3: Calculate delay in milliseconds to start polling 1 hour before first pitch
    const delayMs = Math.max(0, gameStart.getTime() - now.getTime() - 60 * 60 * 1000);

    // Step 4: Schedule QStash job to run every 5 minutes
    const res = await fetch(`${QSTASH_ENDPOINT}/${encodeURIComponent(POLLING_ENDPOINT)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${QSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Delay": delayMs.toString(),
          "Upstash-Cron": "*/5 * * * *"
        },
        body: JSON.stringify({ action: "start-multi-game-polling" }),
      });
      

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: "Failed to schedule QStash job", details: error }, { status: 500 });
    }

    return NextResponse.json({ message: "Polling job scheduled", delayMinutes: Math.floor(delayMs / 60000) });
  } catch (error) {
    console.error("Error setting up polling schedule:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
