import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Client as QStashClient } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN!;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});
const qstashClient = new QStashClient({ token: QSTASH_TOKEN });

const MLB_SCHEDULE_URL = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=";
const MLB_LIVE_URL = "https://statsapi.mlb.com/api/v1.1/game";

async function maybeScheduleFollowUpPoll(games: any[]) {
  const unfinishedGames = games.filter(
    (g: any) => g.status !== "Final" && g.status !== "Postponed"
  );

  if (unfinishedGames.length === 0) {
    console.log("[CACHE] All games final or postponed — no follow-up needed.");
    return;
  }

  const now = Date.now();
  const expiresAt = now + 8 * 60 * 60 * 1000;

  const res = await qstashClient.publishJSON({
    url: "https://www.oddsmash.io/api/cron/mlb/cache",
    body: { reason: "follow-up-polling" },
    cron: "*/5 * * * *",
    notBefore: now + 60 * 1000,
    expiresAt,
  });

  console.log("[CACHE] Scheduled follow-up polling job:", res.messageId);
}

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

      gameSummaries.push({
        gamePk,
        status: liveData.gameData.status.detailedState,
        home: liveData.liveData.boxscore.teams.home,
        away: liveData.liveData.boxscore.teams.away,
        linescore: liveData.liveData.linescore,
      });
    }

    const redisKey = `mlb:boxscore:${dateStr}`;
    await redis.set(redisKey, gameSummaries, { ex: 60 * 60 * 48 });

    await maybeScheduleFollowUpPoll(gameSummaries);

    return NextResponse.json({
      message: "Boxscore cache updated",
      key: redisKey,
      games: gameSummaries.length,
    });
  } catch (err) {
    console.error("[CACHE] Failed to cache or schedule follow-up:", err);
    return NextResponse.json({ error: "Cache update failed" }, { status: 500 });
  }
}
