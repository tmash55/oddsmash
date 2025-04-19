// /app/api/playoff-game-logs/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2023-24&SeasonType=Playoffs&Sorter=DATE";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.nba.com/",
        "Accept": "application/json",
        "x-nba-stats-origin": "stats",
        "x-nba-stats-token": "true",
      },
      cache: "no-store", // optional: prevents caching if you want fresh data
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch NBA data", error);
    return NextResponse.json({ error: "Failed to fetch NBA data" }, { status: 500 });
  }
}
