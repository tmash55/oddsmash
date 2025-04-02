import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Update the formatOdds function to handle undefined or null values
export function formatOdds(odds: number | undefined | null): string {
  if (odds === undefined || odds === null) {
    return "-";
  }
  return odds > 0 ? `+${odds}` : odds.toString();
}
