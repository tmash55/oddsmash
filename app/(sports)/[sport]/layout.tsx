import type React from "react";
import { notFound } from "next/navigation";
import { SportsSubNav } from "@/components/sports-sub-nav";

// Define valid sports
const validSports = ["nba", "nfl", "mlb", "nhl"];

export default function SportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { sport: string };
}) {
  const { sport } = params;

  // Validate the sport parameter
  if (!sport || !validSports.includes(sport.toLowerCase())) {
    notFound();
  }

  // Determine which base route we're in
  const pathname = sport + "/player-props"; // Default assumption
  let baseRoute: "player-props" | "hit-rates" | "parlay-builder" | "tracker" =
    "player-props";

  if (pathname.includes("/hit-rates")) {
    baseRoute = "hit-rates";
  } else if (pathname.includes("/parlay-builder")) {
    baseRoute = "parlay-builder";
  } else if (pathname.includes("/tracker")) {
    baseRoute = "tracker";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SportsSubNav baseRoute={baseRoute} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
