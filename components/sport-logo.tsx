"use client";

import { cn } from "@/lib/utils";
import { SportIcon } from "./sport-icon";
import Image from "next/image";
import { sports } from "@/data/sports-data";

interface SportLogoProps {
  sport: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function SportLogo({ sport, size = "md", className }: SportLogoProps) {
  // Find the sport in our data
  const sportData = sports.find((s) => s.id === sport);

  // Size mappings for images
  const imageSizeMap = {
    xs: { width: 16, height: 16 },
    sm: { width: 20, height: 20 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
  };

  // Container size mappings
  const containerSizeMap = {
    xs: "h-5 w-5",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  // If we have the sport data and it uses an image
  if (sportData?.useImage && sportData.icon) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden",
          containerSizeMap[size],
          className
        )}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={sportData.icon || "/placeholder.svg"}
            alt={sportData.name}
            width={imageSizeMap[size].width}
            height={imageSizeMap[size].height}
            className="object-contain max-h-[80%] max-w-[80%]"
          />
        </div>
      </div>
    );
  }

  // Otherwise use the existing SportIcon component
  return <SportIcon sport={sport} size={size} className={className} />;
}
