"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dumbbell, ClubIcon as GolfIcon } from "lucide-react";
import { SportIcon } from "@/components/sport-icon";

type Sport = {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
};

type SportsSubNavProps = {
  baseRoute: "player-props" | "hit-rates" | "parlay-builder" | "tracker";
  className?: string;
};

export function SportsSubNav({ baseRoute, className }: SportsSubNavProps) {
  const pathname = usePathname();

  // Define available sports
  const sports: Sport[] = [
    {
      id: "nba",
      name: "NBA",
      icon: <SportIcon sport="nba" size="xs" />,
      path: `/nba/${baseRoute}`,
    },
    {
      id: "nfl",
      name: "NFL",
      icon: <SportIcon sport="nfl" size="xs" />,
      path: `/nfl/${baseRoute}`,
    },
    {
      id: "mlb",
      name: "MLB",
      icon: <SportIcon sport="mlb" size="xs" />,
      path: `/mlb/${baseRoute}`,
    },
    {
      id: "nhl",
      name: "NHL",
      icon: <SportIcon sport="nhl" size="xs" />,
      path: `/nhl/${baseRoute}`,
    },
  ];

  // Helper to check if a sport is active
  const isSportActive = (sportId: string) => {
    return pathname?.includes(`/${sportId}/`) || false;
  };

  return (
    <div className={cn("bg-muted/30 border-b", className)}>
      <div className="container px-4">
        <nav className="flex overflow-x-auto">
          {sports.map((sport) => (
            <Link
              key={sport.id}
              href={sport.path}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                isSportActive(sport.id)
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {sport.icon}
              <span>{sport.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
