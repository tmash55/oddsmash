import { BookmakerOdds, OddsPrice } from "@/types/prop-comparison"

// Configurable settings for EV calculation
const EV_CONFIG = {
  STAKE: 100,                    // Base stake amount for EV calculation
  MIN_PROB_SPREAD: 0.02,         // Minimum probability spread to show EV (2%)
  MIN_BOOKS_REQUIRED: 4,         // Minimum number of books required
  PINNACLE_WEIGHT: 10,          // Weight for Pinnacle odds when not used for no-vig
  REQUIRE_PINNACLE: true        // Whether to require Pinnacle odds for fair line calculation
} as const;

interface EVCalculationResult {
  ev: number;                    // EV percentage
  evDollars: number;            // EV in dollars
  fairProbability: number;       // Calculated fair probability
  bestOdds: number;             // Best available odds
  bestBook: string;             // Book offering best odds
  confidence: 'high' | 'medium' | 'low';  // Confidence based on available books
  booksUsed: number;            // Number of books used in calculation
  pinnacleIncluded: boolean;    // Whether Pinnacle odds were used
  noVigLineUsed: boolean;       // Whether a true no-vig line was used
}

// Convert American odds to decimal
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds === 0) return 1;
  return americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1;
}

// Convert decimal odds to American
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds === 1) return 0;
  return decimalOdds >= 2 
    ? Math.round((decimalOdds - 1) * 100)
    : Math.round(-100 / (decimalOdds - 1));
}

// Convert decimal odds to implied probability
export function decimalToImpliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

// Calculate no-vig fair probability from a two-way market
function calculateNoVigProbability(overOdds: number, underOdds: number): number {
  const overProb = decimalToImpliedProbability(americanToDecimal(overOdds));
  const underProb = decimalToImpliedProbability(americanToDecimal(underOdds));
  const viggedSum = overProb + underProb;
  
  // Return the no-vig probability
  return overProb / viggedSum;
}

// Find best available odds excluding specified books
function findBestOddsExcluding(
  odds: Record<string, BookmakerOdds>, 
  type: 'over' | 'under',
  excludeBooks: string[] = []
): { price: number; book: string } {
  let bestPrice = -Infinity;
  let bestBook = '';

  Object.entries(odds).forEach(([bookId, bookOdds]) => {
    // Skip excluded books
    if (excludeBooks.some(exclude => bookId.toLowerCase().includes(exclude.toLowerCase()))) {
      return;
    }

    const odds = type === 'over' ? bookOdds.over : bookOdds.under;
    if (odds?.price && odds.price > bestPrice) {
      bestPrice = odds.price;
      bestBook = bookId;
    }
  });

  return { price: bestPrice, book: bestBook };
}

// Calculate weighted fair probability when no-vig line isn't available
function calculateWeightedFairProbability(
  odds: Record<string, BookmakerOdds>, 
  type: 'over' | 'under',
  excludeBooks: string[] = []
): { probability: number; booksUsed: number; pinnacleIncluded: boolean } {
  let totalWeight = 0;
  let weightedSum = 0;
  let validBooks = 0;
  let hasPinnacle = false;

  Object.entries(odds).forEach(([bookId, bookOdds]) => {
    // Skip excluded books
    if (excludeBooks.some(exclude => bookId.toLowerCase().includes(exclude.toLowerCase()))) {
      return;
    }

    const currentOdds = type === 'over' ? bookOdds.over : bookOdds.under;
    if (!currentOdds?.price) return;

    validBooks++;
    const isPinnacle = bookId.toLowerCase().includes('pinnacle');
    hasPinnacle = hasPinnacle || isPinnacle;
    
    const weight = isPinnacle ? EV_CONFIG.PINNACLE_WEIGHT : 1;
    const decimalOdds = americanToDecimal(currentOdds.price);
    const impliedProb = decimalToImpliedProbability(decimalOdds);
    
    weightedSum += impliedProb * weight;
    totalWeight += weight;
  });

  return {
    probability: totalWeight > 0 ? weightedSum / totalWeight : 0,
    booksUsed: validBooks,
    pinnacleIncluded: hasPinnacle
  };
}

// Calculate confidence level based on available books and method used
function calculateConfidence(
  booksUsed: number, 
  pinnacleIncluded: boolean,
  noVigLineUsed: boolean
): 'high' | 'medium' | 'low' {
  if (noVigLineUsed && booksUsed >= 4) return 'high';
  if (pinnacleIncluded && booksUsed >= 5) return 'medium';
  if (booksUsed >= EV_CONFIG.MIN_BOOKS_REQUIRED) return 'medium';
  return 'low';
}

// Main EV calculation function
export function calculateEV(odds: Record<string, BookmakerOdds>, type: 'over' | 'under'): EVCalculationResult {
  // First try to get Pinnacle no-vig probability
  const pinnacleOdds = Object.entries(odds).find(([bookId]) => 
    bookId.toLowerCase().includes('pinnacle')
  )?.[1];

  let fairProbability: number;
  let booksUsed = 0;
  let pinnacleIncluded = false;
  let noVigLineUsed = false;

  // If we have both Pinnacle over/under odds, use no-vig line
  if (pinnacleOdds?.over?.price && pinnacleOdds?.under?.price) {
    fairProbability = type === 'over' 
      ? calculateNoVigProbability(pinnacleOdds.over.price, pinnacleOdds.under.price)
      : 1 - calculateNoVigProbability(pinnacleOdds.over.price, pinnacleOdds.under.price);
    
    booksUsed = Object.values(odds).filter(book => 
      type === 'over' ? book.over?.price : book.under?.price
    ).length;
    
    pinnacleIncluded = true;
    noVigLineUsed = true;

    // When using no-vig line, exclude Pinnacle from best odds search
    const { price: bestAmericanOdds, book: bestBook } = findBestOddsExcluding(odds, type, ['pinnacle']);

    // If no valid non-Pinnacle odds found or minimum requirements not met
    if (!bestBook || booksUsed < EV_CONFIG.MIN_BOOKS_REQUIRED) {
      return {
        ev: 0,
        evDollars: 0,
        fairProbability,
        bestOdds: 0,
        bestBook: '',
        confidence: 'low',
        booksUsed,
        pinnacleIncluded,
        noVigLineUsed
      };
    }

    // Calculate EV using dollar-based formula
    const bestDecimalOdds = americanToDecimal(bestAmericanOdds);
    const profitIfWin = (bestDecimalOdds - 1) * EV_CONFIG.STAKE;
    const lossIfLose = EV_CONFIG.STAKE;

    const evDollars = (fairProbability * profitIfWin) - ((1 - fairProbability) * lossIfLose);
    const evPercent = (evDollars / EV_CONFIG.STAKE) * 100;

    // Calculate probability spread
    const bestImpliedProb = decimalToImpliedProbability(bestDecimalOdds);
    const probSpread = Math.abs(fairProbability - bestImpliedProb);

    // Only show EV if spread is significant
    const finalEV = probSpread >= EV_CONFIG.MIN_PROB_SPREAD ? evPercent : 0;
    const finalEVDollars = probSpread >= EV_CONFIG.MIN_PROB_SPREAD ? evDollars : 0;

    return {
      ev: Number(finalEV.toFixed(2)),
      evDollars: Number(finalEVDollars.toFixed(2)),
      fairProbability,
      bestOdds: bestAmericanOdds,
      bestBook,
      confidence: calculateConfidence(booksUsed, pinnacleIncluded, noVigLineUsed),
      booksUsed,
      pinnacleIncluded,
      noVigLineUsed
    };
  }

  // Fallback to weighted average if no Pinnacle two-way market
  const weightedResult = calculateWeightedFairProbability(odds, type);
  fairProbability = weightedResult.probability;
  booksUsed = weightedResult.booksUsed;
  pinnacleIncluded = weightedResult.pinnacleIncluded;

  // Find best odds (can include Pinnacle since we're not using no-vig line)
  const { price: bestAmericanOdds, book: bestBook } = findBestOddsExcluding(odds, type);

  // Check minimum requirements
  if (!bestBook || booksUsed < EV_CONFIG.MIN_BOOKS_REQUIRED || 
      (EV_CONFIG.REQUIRE_PINNACLE && !pinnacleIncluded)) {
    return {
      ev: 0,
      evDollars: 0,
      fairProbability,
      bestOdds: 0,
      bestBook: '',
      confidence: 'low',
      booksUsed,
      pinnacleIncluded,
      noVigLineUsed
    };
  }

  // Calculate EV using dollar-based formula
  const bestDecimalOdds = americanToDecimal(bestAmericanOdds);
  const profitIfWin = (bestDecimalOdds - 1) * EV_CONFIG.STAKE;
  const lossIfLose = EV_CONFIG.STAKE;

  const evDollars = (fairProbability * profitIfWin) - ((1 - fairProbability) * lossIfLose);
  const evPercent = (evDollars / EV_CONFIG.STAKE) * 100;

  // Calculate probability spread
  const bestImpliedProb = decimalToImpliedProbability(bestDecimalOdds);
  const probSpread = Math.abs(fairProbability - bestImpliedProb);

  // Only show EV if spread is significant
  const finalEV = probSpread >= EV_CONFIG.MIN_PROB_SPREAD ? evPercent : 0;
  const finalEVDollars = probSpread >= EV_CONFIG.MIN_PROB_SPREAD ? evDollars : 0;

  return {
    ev: Number(finalEV.toFixed(2)),
    evDollars: Number(finalEVDollars.toFixed(2)),
    fairProbability,
    bestOdds: bestAmericanOdds,
    bestBook,
    confidence: calculateConfidence(booksUsed, pinnacleIncluded, noVigLineUsed),
    booksUsed,
    pinnacleIncluded,
    noVigLineUsed
  };
} 