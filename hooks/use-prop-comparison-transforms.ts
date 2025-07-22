import { useMemo } from 'react'
import type { PlayerOdds, BestOddsFilter, TransformedPlayerOdds, OddsPrice } from '@/types/prop-comparison'

// Helper function to calculate edge percentage
function calculateEdge(odds: Record<string, any>, type: 'over' | 'under' = 'over'): number {
  const prices = Object.values(odds)
    .map(book => book[type]?.price)
    .filter(price => price !== undefined && price !== null) as number[];

  if (prices.length === 0) return 0;

  const decimalOdds = prices.map(price => {
    if (price > 0) return (price / 100) + 1;
    return (100 / Math.abs(price)) + 1;
  });

  const avgDecimal = decimalOdds.reduce((a, b) => a + b, 0) / decimalOdds.length;
  const bestDecimal = Math.max(...decimalOdds);
  return ((bestDecimal / avgDecimal) - 1) * 100;
}

interface UseTransformedDataParams {
  data: PlayerOdds[] | undefined;
  globalLine: string | null;
  searchQuery: string;
  selectedGames: string[] | null;
  bestOddsFilter: BestOddsFilter | null;
  sortField: "odds" | "line" | "edge" | "name" | "ev";
  sortDirection: "asc" | "desc";
}

interface UseTransformedDataResult {
  processedData: TransformedPlayerOdds[];
  filteredData: TransformedPlayerOdds[];
  sortedData: TransformedPlayerOdds[];
  totalCount: number;
  filteredCount: number;
  sortedCount: number;
}

export function useTransformedPropData({
  data,
  globalLine,
  searchQuery,
  selectedGames,
  bestOddsFilter,
  sortField,
  sortDirection,
}: UseTransformedDataParams): UseTransformedDataResult {
  // Step 1: Process raw data (only when data or globalLine changes)
  const processedData = useMemo(() => {
    if (!data) return [];
    
    return data.map(item => {
      // For home runs market, always use 0.5 as the standard line when no global line is selected
      const activeLine = globalLine 
        ? (item.lines?.[globalLine] ? globalLine : Object.keys(item.lines || {})[0])
        : (item.market === "batter_home_runs" ? "0.5" : Object.keys(item.lines || {})[0]);
      
      const lineOdds = item.lines?.[activeLine] || {};

      let bestOverOdds: OddsPrice | null = null;
      let bestUnderOdds: OddsPrice | null = null;
      let bestOverPrice = -Infinity;
      let bestUnderPrice = -Infinity;
      let bestOverBook = "";
      let bestUnderBook = "";

      // Cache edge calculations
      const edgeValues = new Map<'over' | 'under', number>();

      Object.entries(lineOdds).forEach(([bookId, bookOdds]) => {
        if (bookOdds.over && bookOdds.over.price > bestOverPrice) {
          bestOverPrice = bookOdds.over.price;
          bestOverBook = bookId;
          bestOverOdds = bookOdds.over;
        }
        if (bookOdds.under && bookOdds.under.price > bestUnderPrice) {
          bestUnderPrice = bookOdds.under.price;
          bestUnderBook = bookId;
          bestUnderOdds = bookOdds.under;
        }
      });

      // Pre-calculate edges
      edgeValues.set('over', calculateEdge(lineOdds, 'over'));
      edgeValues.set('under', calculateEdge(lineOdds, 'under'));

      return {
        ...item,
        bestOverOdds,
        bestUnderOdds,
        bestOverPrice: bestOverPrice === -Infinity ? 0 : bestOverPrice,
        bestUnderPrice: bestUnderPrice === -Infinity ? 0 : bestUnderPrice,
        bestOverBook,
        bestUnderBook,
        activeLine,
        edgeValues,
      } as TransformedPlayerOdds;
    });
  }, [data, globalLine]);

  // Step 2: Filter data (only when processed data or filters change)
  const filteredData = useMemo(() => {
    return processedData.filter(item => {
      // Filter out players who don't have the selected line when globalLine is set
      if (globalLine && (!item.lines || !item.lines[globalLine])) {
        return false;
      }

      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const descriptionLower = item.description.toLowerCase();
        if (!descriptionLower.includes(searchLower)) {
          return false;
        }
      }

      // Apply game filter
      if (selectedGames?.length) {
        if (!selectedGames.includes(item.event_id)) {
          return false;
        }
      }

      // Apply best odds filter using pre-calculated edges
      if (bestOddsFilter) {
        const edge = item.edgeValues.get(bestOddsFilter.type) || 0;
        return edge >= bestOddsFilter.minOdds;
      }
      
      return true;
    });
  }, [processedData, searchQuery, selectedGames, bestOddsFilter, globalLine]);

  // Step 3: Sort data (only when filtered data or sort params change)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description);
      }
      
      if (sortField === "line") {
        const aLine = parseFloat(a.activeLine);
        const bLine = parseFloat(b.activeLine);
        return sortDirection === "asc"
          ? aLine - bLine
          : bLine - aLine;
      }
      
      if (sortField === "edge") {
        const type = bestOddsFilter?.type || 'over';
        const aEdge = a.edgeValues.get(type) || 0;
        const bEdge = b.edgeValues.get(type) || 0;
        return sortDirection === "asc"
          ? aEdge - bEdge
          : bEdge - aEdge;
      }
      
      if (sortField === "odds") {
        return sortDirection === "asc"
          ? a.bestOverPrice - b.bestOverPrice
          : b.bestOverPrice - a.bestOverPrice;
      }

      if (sortField === "ev") {
        // Default to desc (highest to lowest) for EV
        const actualDirection = sortDirection === "asc" ? "desc" : "asc";
        const type = bestOddsFilter?.type || 'over';
        const aEdge = a.edgeValues.get(type) || 0;
        const bEdge = b.edgeValues.get(type) || 0;
        return actualDirection === "asc"
          ? aEdge - bEdge
          : bEdge - aEdge;
      }

      return 0;
    });
  }, [filteredData, sortField, sortDirection, bestOddsFilter?.type]);

  // Return processed data and metadata
  return {
    processedData,
    filteredData,
    sortedData,
    totalCount: data?.length || 0,
    filteredCount: filteredData.length,
    sortedCount: sortedData.length,
  };
} 