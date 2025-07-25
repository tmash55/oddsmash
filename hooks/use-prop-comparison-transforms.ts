import { useMemo } from 'react'
import type { PlayerOdds, BestOddsFilter, TransformedPlayerOdds, OddsPrice } from '@/types/prop-comparison'
import { 
  getBestBook, 
  getBestPrice, 
  getValuePercent, 
  isBookBest,
  getMaxValuePercent 
} from '@/lib/prop-metrics-utils'

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

      // Cache value percentages using metrics
      const edgeValues = new Map<'over' | 'under', number>();
      edgeValues.set('over', getValuePercent(item, activeLine, 'over'));
      edgeValues.set('under', getValuePercent(item, activeLine, 'under'));

      // Get best books and prices from metrics
      const bestOverBook = getBestBook(item, activeLine, 'over') || '';
      const bestUnderBook = getBestBook(item, activeLine, 'under') || '';
      const bestOverPrice = getBestPrice(item, activeLine, 'over');
      const bestUnderPrice = getBestPrice(item, activeLine, 'under');

      // Get best odds objects
      const bestOverOdds = bestOverPrice ? {
        price: bestOverPrice,
        sid: bestOverBook,
        link: lineOdds[bestOverBook]?.over?.link
      } : null;

      const bestUnderOdds = bestUnderPrice ? {
        price: bestUnderPrice,
        sid: bestUnderBook,
        link: lineOdds[bestUnderBook]?.under?.link
      } : null;

      return {
        ...item,
        bestOverOdds,
        bestUnderOdds,
        bestOverPrice,
        bestUnderPrice,
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

      // Apply best odds filter using Redis metrics
      if (bestOddsFilter) {
        const bestBook = getBestBook(item, item.activeLine, bestOddsFilter.type);
        return bestBook?.toLowerCase() === bestOddsFilter.sportsbook.toLowerCase();
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
        const aValue = getValuePercent(a, a.activeLine, type);
        const bValue = getValuePercent(b, a.activeLine, type);
        return sortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      
      if (sortField === "odds") {
        const aPrice = getBestPrice(a, a.activeLine, 'over');
        const bPrice = getBestPrice(b, b.activeLine, 'over');
        return sortDirection === "asc"
          ? aPrice - bPrice
          : bPrice - aPrice;
      }

      if (sortField === "ev") {
        const aValue = getMaxValuePercent(a, a.activeLine);
        const bValue = getMaxValuePercent(b, b.activeLine);
        return sortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
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