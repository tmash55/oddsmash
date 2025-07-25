import type { PlayerOdds, LineMetrics } from "@/types/prop-comparison";

// Helper to get metrics for a specific line and type
export function getMetrics(
  item: PlayerOdds,
  line: string,
  type: "over" | "under"
): LineMetrics | null {
  return item.metrics?.[line]?.[type] || null;
}

// Helper to get best book for a specific line and type
export function getBestBook(
  item: PlayerOdds,
  line: string,
  type: "over" | "under"
): string | null {
  return item.metrics?.[line]?.[type]?.best_book || null;
}

// Helper to get value percentage for a specific line and type
export function getValuePercent(
  item: PlayerOdds,
  line: string,
  type: "over" | "under"
): number {
  return item.metrics?.[line]?.[type]?.value_pct || 0;
}

// Helper to get best price for a specific line and type
export function getBestPrice(
  item: PlayerOdds,
  line: string,
  type: "over" | "under"
): number {
  return item.metrics?.[line]?.[type]?.best_price || 0;
}

// Helper to check if a sportsbook is the best book for a line and type
export function isBookBest(
  item: PlayerOdds,
  line: string,
  type: "over" | "under",
  bookId: string
): boolean {
  const bestBook = getBestBook(item, line, type);
  return bestBook?.toLowerCase() === bookId.toLowerCase();
}

// Helper to get the maximum value percentage across both over/under
export function getMaxValuePercent(item: PlayerOdds, line: string): number {
  const overValue = getValuePercent(item, line, "over");
  const underValue = getValuePercent(item, line, "under");
  return Math.max(overValue, underValue);
} 