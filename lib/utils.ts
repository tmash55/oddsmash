import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format odds for display
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString();
}
