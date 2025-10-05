"use client";

import { useMemo } from "react";
import { useArbsStream } from "@/hooks/useArbsStream";
import { useArbitragePreferences } from "@/contexts/preferences-context";
import { matchesArbRow } from "@/lib/arbs-filters";

export function useArbsView({ pro, live, eventId, limit = 100, mode }: { pro: boolean; live: boolean; eventId?: string; limit?: number; mode: "prematch" | "live" }) {
  const { filters: arbPrefs, isLoading: prefsLoading, updateFilters } = useArbitragePreferences();
  const stream = useArbsStream({ pro, live, eventId, limit });

  // Counts across the full stream after applying user filters (book, roi, search)
  const counts = useMemo(() => {
    const effectiveMax = pro ? arbPrefs.maxArb : Math.min(arbPrefs.maxArb ?? 2, 2);
    const filtered = stream.rows.filter((r) =>
      matchesArbRow(r as any, {
        selectedBooks: arbPrefs.selectedBooks,
        minArb: arbPrefs.minArb,
        maxArb: effectiveMax,
        searchQuery: arbPrefs.searchQuery,
      })
    );
    const liveCount = filtered.filter((r) => Boolean((r as any).ev?.live)).length;
    const pregameCount = filtered.length - liveCount;
    return { live: liveCount, pregame: pregameCount };
  }, [stream.rows, arbPrefs, pro]);

  const filteredRows = useMemo(() => {
    if (prefsLoading) return stream.rows;
    const wantLive = mode === "live";
    const effectiveMax = pro ? arbPrefs.maxArb : Math.min(arbPrefs.maxArb ?? 2, 2);
    return stream.rows.filter((r) =>
      // live/prematch filter
      Boolean((r as any).ev?.live) === wantLive &&
      matchesArbRow(r as any, {
        selectedBooks: arbPrefs.selectedBooks,
        minArb: arbPrefs.minArb,
        maxArb: effectiveMax,
        searchQuery: arbPrefs.searchQuery,
      })
    );
  }, [stream.rows, prefsLoading, arbPrefs, mode, pro]);

  return {
    ...stream,
    rows: filteredRows,
    counts,
    prefs: arbPrefs,
    prefsLoading,
    updateFilters,
  };
}


