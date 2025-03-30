import { useState, useEffect } from 'react';
import { Sportsbook, sportsbooks as defaultSportsbooks } from '@/data/sportsbooks';

const STORAGE_KEY = 'oddsmash-sportsbook-preferences';
const MAX_SELECTIONS = 5;
const DEFAULT_SELECTIONS = ['draftkings', 'fanduel', 'fanatics', 'espnbet', 'williamhill_us'];

export function useSportsbookPreferences() {
  // Initialize with DEFAULT_SELECTIONS for SSR
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>(DEFAULT_SELECTIONS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure stored preferences don't exceed MAX_SELECTIONS
        setSelectedSportsbooks(parsed.slice(0, MAX_SELECTIONS));
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Update localStorage when selection changes, but only after initialization
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSportsbooks));
    }
  }, [selectedSportsbooks, isInitialized]);

  const toggleSportsbook = (idOrIds: string | string[]) => {
    if (Array.isArray(idOrIds)) {
      // Bulk update
      setSelectedSportsbooks(idOrIds.slice(0, MAX_SELECTIONS));
    } else {
      // Single toggle
      setSelectedSportsbooks(prev => {
        if (prev.includes(idOrIds)) {
          // Don't allow deselecting if it's the last one
          if (prev.length === 1) return prev;
          return prev.filter(sbId => sbId !== idOrIds);
        }
        // Don't allow adding if already at max selections
        if (prev.length >= MAX_SELECTIONS) return prev;
        return [...prev, idOrIds];
      });
    }
  };

  const selectAll = () => {
    // Only select up to MAX_SELECTIONS books
    setSelectedSportsbooks(defaultSportsbooks.map(sb => sb.id).slice(0, MAX_SELECTIONS));
  };

  const clearAll = () => {
    // Set to first default selection when clearing
    setSelectedSportsbooks([DEFAULT_SELECTIONS[0]]);
  };

  return {
    selectedSportsbooks,
    toggleSportsbook,
    selectAll,
    clearAll,
    maxSelections: MAX_SELECTIONS,
  };
} 