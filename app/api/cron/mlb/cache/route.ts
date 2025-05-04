// /app/api/cron/mlb/cache/route.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const MLB_SCHEDULE_URL = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=";
const MLB_LIVE_URL = "https://statsapi.mlb.com/api/v1.1/game";

export async function POST() {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const scheduleRes = await fetch(`${MLB_SCHEDULE_URL}${dateStr}`);
    const scheduleData = await scheduleRes.json();

    if (!scheduleData.dates?.[0]?.games?.length) {
      return NextResponse.json({ message: "No games today" });
    }

    const games = scheduleData.dates[0].games;
    const gameSummaries = [];

    for (const game of games) {
      const { gamePk } = game;
      const liveRes = await fetch(`${MLB_LIVE_URL}/${gamePk}/feed/live`);
      if (!liveRes.ok) continue;

      const liveData = await liveRes.json();

      // You can shape this however you need
      gameSummaries.push({
        gamePk,
        status: liveData.gameData.status.detailedState,
        home: liveData.liveData.boxscore.teams.home,
        away: liveData.liveData.boxscore.teams.away,
        linescore: liveData.liveData.linescore,
      });
    }

    // Store in Redis with TTL of 48 hours
    const redisKey = `mlb:boxscore:${dateStr}`;
    await redis.set(redisKey, gameSummaries, { ex: 60 * 60 * 48 });

    return NextResponse.json({ message: "Boxscore cache updated", key: redisKey, games: gameSummaries.length });
  } catch (error) {
    console.error("[MLB_CACHE] Error:", error);
    return NextResponse.json({ error: "Failed to cache boxscores" }, { status: 500 });
  }
}
