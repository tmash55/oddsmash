// Odds conversion utilities
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

// Calculate parlay odds for multiple selections
export function calculateParlayOdds(odds: number[], alreadyDecimal: boolean = false): number {
  // Convert all odds to decimal if they're not already
  const decimalOdds = alreadyDecimal ? odds : odds.map(americanToDecimal);
  
  // Multiply all decimal odds
  const totalDecimalOdds = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  
  // If odds were already decimal, return decimal odds
  if (alreadyDecimal) {
    return totalDecimalOdds;
  }
  
  // Convert back to American odds only if input was American
  return decimalToAmerican(totalDecimalOdds);
}

// Calculate Same Game Parlay (SGP) odds with correlation factor
export function calculateSGPOdds(odds: number[], numLegs: number): number {
  // Convert to decimal odds
  const decimalOdds = odds.map(americanToDecimal);
  
  // Base total: multiply all decimal odds
  const baseDecimal = decimalOdds.reduce((acc, val) => acc * val, 1);
  
  // Apply correlation factor
  const baseCorrelationFactor = 0.72; // base reduction factor (FanDuel-style)
  const correlationMultiplier = Math.pow(baseCorrelationFactor, numLegs - 1);
  const adjustedDecimal = baseDecimal * correlationMultiplier;
  
  // Convert back to American odds
  return decimalToAmerican(adjustedDecimal);
}

// Calculate potential payout
export function calculatePayout(odds: number | null, wager: number): number {
  if (odds === null) return 0;

  if (odds > 0) {
    return wager + (wager * odds) / 100;
  } else {
    return wager + (wager * 100) / Math.abs(odds);
  }
}

// Format odds for display
export function formatOdds(odds: number): string {
  if (odds > 0) {
    return `+${odds}`;
  }
  return odds.toString();
} 