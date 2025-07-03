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

// Valid sports for the application
export const VALID_SPORTS = ['MLB', 'NBA', 'NFL', 'NHL'] as const
export type Sport = typeof VALID_SPORTS[number]

// Validate sport parameter
export function validateSport(sport: string): sport is Sport {
  return VALID_SPORTS.includes(sport as Sport)
}

export function capitalizeMarket(market: string): string {
  // Handle special cases like 'RBIs' or 'HR'
  const specialCases: Record<string, string> = {
    'rbis': 'RBIs',
    'hr': 'HR',
    'h': 'Hits',
    'tb': 'Total Bases',
  };

  // Check if it's a special case
  if (specialCases[market.toLowerCase()]) {
    return specialCases[market.toLowerCase()];
  }

  // Split by spaces and underscores
  return market
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
