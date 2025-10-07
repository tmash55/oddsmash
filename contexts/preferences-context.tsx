"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { preferencesRPC, type UserPreferences, type UserPreferencesUpdate } from "@/lib/preferences-rpc";
import { sportsbooks } from "@/data/sportsbooks";

interface PreferencesContextType {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Core update functions
  updatePreference: <K extends keyof UserPreferencesUpdate>(
    key: K, 
    value: UserPreferencesUpdate[K],
    optimistic?: boolean
  ) => Promise<void>;
  
  updatePreferences: (updates: UserPreferencesUpdate, optimistic?: boolean) => Promise<void>;
  batchUpdate: (updates: Array<{ key: keyof UserPreferencesUpdate; value: any }>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  
  // Tool-specific helpers
  updateArbitrageFilters: (filters: {
    selectedBooks?: string[];
    minArb?: number;
    maxArb?: number;
    totalBetAmount?: number;
    searchQuery?: string;
    roundBets?: boolean;
  }) => Promise<void>;
  
  getArbitrageFilters: () => {
    selectedBooks: string[];
    minArb: number;
    maxArb: number;
    totalBetAmount: number;
    searchQuery: string;
    roundBets: boolean;
  };
  
  updateEvFilters: (filters: {
    selectedBooks?: string[];
    minOdds?: number;
    maxOdds?: number;
    bankroll?: number;
    kellyPercent?: number;
    searchQuery?: string;
  }) => Promise<void>;

  updateOddsPreferences: (filters: {
    selectedBooks?: string[];
    columnOrder?: string[];
    sportsbookOrder?: string[];
    includeAlternates?: boolean;
    columnHighlighting?: boolean;
    showBestLine?: boolean;
    showAverageLine?: boolean;
  }) => Promise<void>;
  
  // Getters for common data
  getActiveSportsbooks: () => string[];

  getEvFilters: () => {
    selectedBooks: string[];
    minOdds: number;
    maxOdds: number;
    bankroll: number;
    kellyPercent: number;
    searchQuery: string;
  };

  getOddsPreferences: () => {
    selectedBooks: string[];
    columnOrder: string[];
    sportsbookOrder: string[];
    includeAlternates: boolean;
    columnHighlighting: boolean;
    showBestLine: boolean;
    showAverageLine: boolean;
  };
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const LOG_METRICS = process.env.NODE_ENV !== 'production';
  
  // Keep track of pending updates to avoid race conditions
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const metricsRef = useRef({
    updatePreferenceWrites: 0,
    updatePreferencesWrites: 0,
    batchUpdateWrites: 0,
    skippedNoop: 0,
  });

  const publishMetrics = useCallback(() => {
    if (typeof window !== 'undefined') {
      (window as any).__prefsMetrics = { ...metricsRef.current };
    }
  }, []);

  // Load initial preferences
  const loadPreferences = useCallback(async () => {
    if (!user) {
      console.log('🔄 PreferencesContext: No user, clearing preferences');
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    console.log('🔄 PreferencesContext: Loading preferences for user:', user.id, 'at', new Date().toISOString());

    try {
      setIsLoading(true);
      setError(null);
      const prefs = await preferencesRPC.getPreferences(user.id);
      console.log('✅ PreferencesContext: Loaded preferences at', new Date().toISOString(), ':', {
        userId: user.id,
        preferred_sportsbooks: prefs.preferred_sportsbooks,
        preferred_sportsbooks_count: prefs.preferred_sportsbooks?.length,
        hasPreferences: !!prefs
      });
      setPreferences(prefs);
    } catch (err) {
      console.error("❌ Failed to load preferences:", err);
      setError(err instanceof Error ? err.message : "Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load preferences when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Generic preference update with optimistic updates
  const updatePreference = useCallback(async <K extends keyof UserPreferencesUpdate>(
    key: K,
    value: UserPreferencesUpdate[K],
    optimistic = true
  ) => {
    if (!user || !preferences) {
      console.log('⚠️ Cannot update preference: no user or preferences', { user: !!user, preferences: !!preferences });
      return;
    }

    // No-op guard to avoid redundant writes
    const currentValue = (preferences as any)[key];
    const isArray = Array.isArray(currentValue) || Array.isArray(value as any);
    const isEqual = isArray
      ? Array.isArray(currentValue) && Array.isArray(value) && currentValue.length === (value as any[]).length && currentValue.every((v: any, i: number) => v === (value as any[])[i])
      : currentValue === value;
    if (isEqual) {
      metricsRef.current.skippedNoop += 1;
      LOG_METRICS && console.log('⏭️ Skipping update - no change detected for key:', String(key), 'metrics:', metricsRef.current);
      publishMetrics();
      return;
    }

    const updateKey = `${key}-${JSON.stringify(value)}`;
    
    // Prevent duplicate updates
    if (pendingUpdatesRef.current.has(updateKey)) {
      console.log('⚠️ Duplicate update prevented for:', updateKey);
      return;
    }
    pendingUpdatesRef.current.add(updateKey);

    console.log('🔄 PreferencesContext: Updating preference at', new Date().toISOString(), {
      key,
      value,
      valueLength: Array.isArray(value) ? value.length : 'not-array',
      userId: user.id,
      optimistic
    });

    try {
      // Optimistic update
      if (optimistic) {
        setPreferences(prev => prev ? { ...prev, [key]: value } : null);
        console.log('✅ Optimistic update applied');
      }

      // Save to database
      await preferencesRPC.updatePreference(user.id, key, value);
      console.log('✅ Database update completed at', new Date().toISOString());
      metricsRef.current.updatePreferenceWrites += 1;
      LOG_METRICS && console.log('🧪 Metrics after updatePreference:', metricsRef.current);
      publishMetrics();
      
      // Refresh from database to ensure consistency
      if (!optimistic) {
        const updatedPrefs = await preferencesRPC.getPreferences(user.id);
        setPreferences(updatedPrefs);
        console.log('✅ Non-optimistic update: refreshed from database');
      }
    } catch (err) {
      console.error(`❌ Failed to update ${String(key)}:`, err);
      
      // Revert optimistic update on error
      if (optimistic) {
        const freshPrefs = await preferencesRPC.getPreferences(user.id);
        setPreferences(freshPrefs);
        console.log('🔄 Reverted optimistic update due to error');
      }
      
      setError(err instanceof Error ? err.message : `Failed to update ${String(key)}`);
    } finally {
      pendingUpdatesRef.current.delete(updateKey);
    }
  }, [user, preferences]);

  // Batch preferences update
  const updatePreferences = useCallback(async (
    updates: UserPreferencesUpdate,
    optimistic = true
  ) => {
    if (!user || !preferences) return;

    try {
      // Filter out no-op updates
      const effectiveUpdates = Object.keys(updates).reduce((acc, k) => {
        const key = k as keyof UserPreferencesUpdate;
        const nextVal = updates[key] as any;
        const prevVal = (preferences as any)[key];
        const isArray = Array.isArray(nextVal) || Array.isArray(prevVal);
        const equal = isArray
          ? Array.isArray(nextVal) && Array.isArray(prevVal) && nextVal.length === prevVal.length && nextVal.every((v: any, i: number) => v === prevVal[i])
          : nextVal === prevVal;
        if (!equal) {
          (acc as any)[key] = nextVal;
        }
        return acc;
      }, {} as UserPreferencesUpdate);

      if (Object.keys(effectiveUpdates).length === 0) {
        metricsRef.current.skippedNoop += 1;
        LOG_METRICS && console.log('⏭️ Skipping updatePreferences - no changes detected', 'metrics:', metricsRef.current);
        publishMetrics();
        return;
      }

      // Optimistic update
      if (optimistic) {
        setPreferences(prev => prev ? { ...prev, ...effectiveUpdates } : null);
      }

      // Save to database
      const updatedPrefs = await preferencesRPC.updatePreferences(user.id, effectiveUpdates);
      metricsRef.current.updatePreferencesWrites += 1;
      LOG_METRICS && console.log('🧪 Metrics after updatePreferences:', metricsRef.current);
      publishMetrics();
      
      // Set final state from database response
      setPreferences(updatedPrefs);
    } catch (err) {
      console.error("Failed to update preferences:", err);
      
      // Revert optimistic update on error
      if (optimistic) {
        const freshPrefs = await preferencesRPC.getPreferences(user.id);
        setPreferences(freshPrefs);
      }
      
      setError(err instanceof Error ? err.message : "Failed to update preferences");
    }
  }, [user, preferences]);

  // Batch update multiple fields
  const batchUpdate = useCallback(async (
    updates: Array<{ key: keyof UserPreferencesUpdate; value: any }>
  ) => {
    if (!user || !preferences) return;

    try {
      // Remove no-op updates
      const filtered = updates.filter(({ key, value }) => {
        const prevVal = (preferences as any)[key];
        const isArray = Array.isArray(value) || Array.isArray(prevVal);
        if (isArray) {
          return !(Array.isArray(value) && Array.isArray(prevVal) && value.length === prevVal.length && value.every((v: any, i: number) => v === prevVal[i]));
        }
        return value !== prevVal;
      });

      if (filtered.length === 0) {
        metricsRef.current.skippedNoop += 1;
        LOG_METRICS && console.log('⏭️ Skipping batchUpdate - no changes detected', 'metrics:', metricsRef.current);
        publishMetrics();
        return;
      }

      // Optimistic update
      const optimisticUpdates = filtered.reduce((acc, { key, value }) => {
        (acc as any)[key] = value;
        return acc;
      }, {} as UserPreferencesUpdate);
      
      setPreferences(prev => prev ? { ...prev, ...optimisticUpdates } : null);

      // Save to database
      const updatedPrefs = await preferencesRPC.batchUpdatePreferences(user.id, filtered);
      metricsRef.current.batchUpdateWrites += 1;
      LOG_METRICS && console.log('🧪 Metrics after batchUpdate:', metricsRef.current);
      publishMetrics();
      setPreferences(updatedPrefs);
    } catch (err) {
      console.error("Failed to batch update preferences:", err);
      
      // Revert optimistic update on error
      const freshPrefs = await preferencesRPC.getPreferences(user.id);
      setPreferences(freshPrefs);
      
      setError(err instanceof Error ? err.message : "Failed to update preferences");
    }
  }, [user, preferences]);

  // Reset preferences
  const resetPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const resetPrefs = await preferencesRPC.resetPreferences(user.id);
      setPreferences(resetPrefs);
    } catch (err) {
      console.error("Failed to reset preferences:", err);
      setError(err instanceof Error ? err.message : "Failed to reset preferences");
    }
  }, [user]);

  // Tool-specific helpers
  const updateArbitrageFilters = useCallback(async (filters: {
    selectedBooks?: string[];
    minArb?: number;
    maxArb?: number;
    searchQuery?: string;
    totalBetAmount?: number;
    roundBets?: boolean;
  }) => {
    const updates: UserPreferencesUpdate = {};
    
    if (filters.selectedBooks !== undefined) {
      // Store tool-specific selection in arbitrage_selected_books (not global preferred)
      (updates as any).arbitrage_selected_books = filters.selectedBooks;
    }
    if (filters.minArb !== undefined) {
      updates.arbitrage_min_arb = filters.minArb;
    }
    if (filters.maxArb !== undefined) {
      updates.arbitrage_max_arb = filters.maxArb;
    }
    if (filters.totalBetAmount !== undefined) {
      updates.arbitrage_total_bet_amount = filters.totalBetAmount;
    }
    if (filters.searchQuery !== undefined) {
      updates.arbitrage_search_query = filters.searchQuery;
    }
    if (filters.roundBets !== undefined) {
      (updates as any).arbitrage_round_bets = filters.roundBets;
    }
    
    await updatePreferences(updates);
  }, [updatePreferences]);

  const updateEvFilters = useCallback(async (filters: {
    selectedBooks?: string[];
    minOdds?: number;
    maxOdds?: number;
    bankroll?: number;
    kellyPercent?: number;
    searchQuery?: string;
  }) => {
    const updates: UserPreferencesUpdate = {};
    
    if (filters.selectedBooks !== undefined) {
      updates.preferred_sportsbooks = filters.selectedBooks;
    }
    if (filters.minOdds !== undefined) {
      updates.ev_min_odds = filters.minOdds;
    }
    if (filters.maxOdds !== undefined) {
      updates.ev_max_odds = filters.maxOdds;
    }
    if (filters.bankroll !== undefined) {
      updates.ev_bankroll = filters.bankroll;
    }
    if (filters.kellyPercent !== undefined) {
      updates.ev_kelly_percent = filters.kellyPercent;
    }
    if (filters.searchQuery !== undefined) {
      updates.ev_search_query = filters.searchQuery;
    }
    
    await updatePreferences(updates);
  }, [updatePreferences]);

  const updateOddsPreferences = useCallback(async (filters: {
    selectedBooks?: string[];
    columnOrder?: string[];
    sportsbookOrder?: string[];
    includeAlternates?: boolean;
    columnHighlighting?: boolean;
    showBestLine?: boolean;
    showAverageLine?: boolean;
  }) => {
    const updates: UserPreferencesUpdate = {};

    if (filters.selectedBooks !== undefined) {
      updates.odds_selected_books = filters.selectedBooks;
    }
    if (filters.columnOrder !== undefined) {
      updates.odds_column_order = filters.columnOrder;
    }
    if (filters.sportsbookOrder !== undefined) {
      updates.odds_sportsbook_order = filters.sportsbookOrder;
    }
    if (filters.includeAlternates !== undefined) {
      updates.include_alternates = filters.includeAlternates;
    }
    if (filters.columnHighlighting !== undefined) {
      updates.odds_column_highlighting = filters.columnHighlighting;
    }
    if (filters.showBestLine !== undefined) {
      updates.odds_show_best_line = filters.showBestLine;
    }
    if (filters.showAverageLine !== undefined) {
      updates.odds_show_average_line = filters.showAverageLine;
    }

    await updatePreferences(updates);
  }, [updatePreferences]);

  // Getter helpers - memoize to ensure stable reference
  const activeSportsbooks = useMemo(() => {
    return sportsbooks.filter(sb => sb.isActive).map(sb => sb.id);
  }, []);

  const getActiveSportsbooks = useCallback(() => {
    return activeSportsbooks;
  }, [activeSportsbooks]);

  const getArbitrageFilters = useCallback(() => {
    // If preferences haven't loaded yet (logged-out user), default to all active books
    if (!preferences) {
      return {
        selectedBooks: activeSportsbooks,
        minArb: 0,
        maxArb: 20,
        totalBetAmount: 200,
        searchQuery: "",
        roundBets: false,
      };
    }
    
    // Use the user's preferred sportsbooks, or default to all active books for new users
    // The key insight: if preferred_sportsbooks exists in the object, use it (even if empty)
    // Only default to all books if the user has never set preferences
    const selectedBooks = (preferences as any).arbitrage_selected_books !== undefined
      ? ((preferences as any).arbitrage_selected_books as string[])
      : (preferences.preferred_sportsbooks ?? activeSportsbooks);
    
    return {
      selectedBooks,
      minArb: preferences.arbitrage_min_arb ?? 0,
      maxArb: preferences.arbitrage_max_arb ?? 20,
      totalBetAmount: (typeof preferences.arbitrage_total_bet_amount === 'number' ? preferences.arbitrage_total_bet_amount : Number(preferences.arbitrage_total_bet_amount)) ?? 200,
      searchQuery: preferences.arbitrage_search_query || "",
      roundBets: (preferences as any).arbitrage_round_bets ?? false,
    };
  }, [preferences, activeSportsbooks]);

  const getEvFilters = useCallback(() => {
    // If preferences haven't loaded yet (logged-out user), default to all active books
    if (!preferences) {
      return {
        selectedBooks: activeSportsbooks,
        minOdds: -200,
        maxOdds: 200,
        bankroll: 1000,
        kellyPercent: 50,
        searchQuery: "",
      };
    }
    
    // Use the user's preferred sportsbooks, or default to all active books for new users
    const selectedBooks = preferences.preferred_sportsbooks ?? activeSportsbooks;
    
    return {
      selectedBooks,
      minOdds: preferences.ev_min_odds ?? -200,
      maxOdds: preferences.ev_max_odds ?? 200,
      bankroll: preferences.ev_bankroll ?? 1000,
      kellyPercent: preferences.ev_kelly_percent ?? 50,
      searchQuery: preferences.ev_search_query || "",
    };
  }, [preferences, activeSportsbooks]);

  const getOddsPreferences = useCallback(() => {
    if (!preferences) {
      return {
        selectedBooks: activeSportsbooks,
        columnOrder: ['entity', 'event', 'best-line', 'average-line'],
        sportsbookOrder: [] as string[],
        includeAlternates: false,
        columnHighlighting: true,
        showBestLine: true,
        showAverageLine: true,
      };
    }

    return {
      selectedBooks: preferences.odds_selected_books?.length ? preferences.odds_selected_books : activeSportsbooks,
      columnOrder: preferences.odds_column_order?.length ? preferences.odds_column_order : ['entity', 'event', 'best-line', 'average-line'],
      sportsbookOrder: preferences.odds_sportsbook_order || [],
      includeAlternates: preferences.include_alternates ?? false,
      columnHighlighting: preferences.odds_column_highlighting ?? true,
      showBestLine: preferences.odds_show_best_line ?? true,
      showAverageLine: preferences.odds_show_average_line ?? true,
    };
  }, [preferences, activeSportsbooks]);

  const value: PreferencesContextType = {
    preferences,
    isLoading,
    error,
    updatePreference,
    updatePreferences,
    batchUpdate,
    resetPreferences,
    updateArbitrageFilters,
    getArbitrageFilters,
    updateEvFilters,
    updateOddsPreferences,
    getActiveSportsbooks,
    getEvFilters,
    getOddsPreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

// Convenience hooks for specific use cases
export function useArbitragePreferences() {
  const { getArbitrageFilters, updateArbitrageFilters, isLoading } = usePreferences();
  
  // Memoize the filters to prevent infinite re-renders
  const filters = useMemo(() => getArbitrageFilters(), [getArbitrageFilters]);
  
  return {
    filters,
    updateFilters: updateArbitrageFilters,
    isLoading,
  };
}

export function useEvPreferences() {
  const { getEvFilters, updateEvFilters, isLoading } = usePreferences();
  
  // Memoize the filters to prevent infinite re-renders
  const filters = useMemo(() => getEvFilters(), [getEvFilters]);
  
  return {
    filters,
    updateFilters: updateEvFilters,
    isLoading,
  };
}

export function useOddsPreferences() {
  const { getOddsPreferences, updateOddsPreferences, isLoading } = usePreferences();

  // Memoize the preferences to prevent infinite re-renders
  const preferences = useMemo(() => getOddsPreferences(), [getOddsPreferences]);

  return {
    preferences,
    updatePreferences: updateOddsPreferences,
    isLoading,
  };
}
