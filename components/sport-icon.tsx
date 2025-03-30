import {
  PiBasketballDuotone,
  PiBaseballDuotone,
  PiFootballDuotone,
  PiHockeyDuotone,
  PiGolfDuotone,
} from "react-icons/pi";
import { cn } from "@/lib/utils";

type SportIconProps = {
  sport: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

export function SportIcon({ sport, size = "md", className }: SportIconProps) {
  // Size mapping for container
  const containerSizeMap = {
    xs: "h-5 w-5",
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  // Size mapping for react-icons (they use pixel values)
  const iconSizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
  };

  // Color mapping
  const colorMap: Record<string, string> = {
    basketball_nba: "text-orange-500",
    nba: "text-orange-500",
    baseball_mlb: "text-red-500",
    mlb: "text-red-500",
    americanfootball_nfl: "text-green-500",
    nfl: "text-green-500",
    hockey_nhl: "text-blue-500",
    nhl: "text-blue-500",
    icehockey_nhl: "text-blue-500",
    golf_pga: "text-emerald-500",
    pga: "text-emerald-500",
  };

  // Get the appropriate icon based on the sport
  const getIcon = () => {
    const sportKey = sport.toLowerCase();
    const iconColor = colorMap[sport] || "text-primary";
    const iconSize = iconSizeMap[size];

    if (sportKey.includes("basketball") || sportKey.includes("nba")) {
      return (
        <PiBasketballDuotone
          size={iconSize}
          className={cn(iconColor, className)}
        />
      );
    }

    if (sportKey.includes("football") || sportKey.includes("nfl")) {
      return (
        <PiFootballDuotone
          size={iconSize}
          className={cn(iconColor, className)}
        />
      );
    }

    if (sportKey.includes("baseball") || sportKey.includes("mlb")) {
      return (
        <PiBaseballDuotone
          size={iconSize}
          className={cn(iconColor, className)}
        />
      );
    }

    if (
      sportKey.includes("hockey") ||
      sportKey.includes("nhl") ||
      sportKey.includes("icehockey")
    ) {
      return (
        <PiHockeyDuotone size={iconSize} className={cn(iconColor, className)} />
      );
    }

    if (sportKey.includes("golf") || sportKey.includes("pga")) {
      return (
        <PiGolfDuotone size={iconSize} className={cn(iconColor, className)} />
      );
    }

    // Default icon - fallback to basketball
    return (
      <PiBasketballDuotone
        size={iconSize}
        className={cn(iconColor, className)}
      />
    );
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        containerSizeMap[size],
        className
      )}
    >
      {getIcon()}
    </div>
  );
}
