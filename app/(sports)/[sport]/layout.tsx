import type React from "react";
import { notFound } from "next/navigation";
import { GradientBackground } from "@/components/ui/gradient-background";

// Define valid sports
const validSports = ["nba", "nfl", "mlb", "nhl", "ncaab"];

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

  return (
    <div>
      {/* SportsSubNav is now moved to the page components */}
      <main>{children}</main>
    </div>
  );
}
