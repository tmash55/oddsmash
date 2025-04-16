"use client";

import { useState, useEffect } from "react";
import { sportsbooks as defaultSportsbooks } from "@/data/sportsbooks";

const SPORTSBOOKS_STORAGE_KEY = "oddsmash-sportsbook-preferences";
const STATE_STORAGE_KEY = "oddsmash-user-state";
// No more MAX_SELECTIONS constant
// Get all sportsbook IDs for default selection
const DEFAULT_SELECTIONS = defaultSportsbooks.map(sb => sb.id);
const DEFAULT_STATE = "NJ"; // Default state if none is selected

// Map of state names to their two-letter codes
export const STATE_CODES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

// States where sports betting is legal (as of 2023)
export const LEGAL_BETTING_STATES = [
  "AZ",
  "CO",
  "CT",
  "DC",
  "IL",
  "IN",
  "IA",
  "KS",
  "LA",
  "MD",
  "MA",
  "MI",
  "NV",
  "NH",
  "NJ",
  "NY",
  "OH",
  "OR",
  "PA",
  "RI",
  "TN",
  "VA",
  "WV",
  "WY",
];

export function useSportsbookPreferences() {
  // Initialize with DEFAULT_SELECTIONS for SSR
  const [selectedSportsbooks, setSelectedSportsbooks] =
    useState<string[]>(DEFAULT_SELECTIONS);
  const [userState, setUserState] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      // Load sportsbook preferences
      const storedSportsbooks = localStorage.getItem(SPORTSBOOKS_STORAGE_KEY);
      if (storedSportsbooks) {
        const parsed = JSON.parse(storedSportsbooks);
        // No more limit on the number of selections
        setSelectedSportsbooks(parsed);
      }

      // Load state preference
      const storedState = localStorage.getItem(STATE_STORAGE_KEY);
      if (storedState) {
        setUserState(storedState);
      } else {
        setUserState(DEFAULT_STATE);
      }

      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Update localStorage when selection changes, but only after initialization
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(
        SPORTSBOOKS_STORAGE_KEY,
        JSON.stringify(selectedSportsbooks)
      );
    }
  }, [selectedSportsbooks, isInitialized]);

  // Update localStorage when state changes
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined" && userState) {
      localStorage.setItem(STATE_STORAGE_KEY, userState);
    }
  }, [userState, isInitialized]);

  const toggleSportsbook = (idOrIds: string | string[]) => {
    if (Array.isArray(idOrIds)) {
      // Bulk update, no limit on selections
      setSelectedSportsbooks(idOrIds);
    } else {
      // Single toggle
      setSelectedSportsbooks((prev) => {
        if (prev.includes(idOrIds)) {
          // Don't allow deselecting if it's the last one
          if (prev.length === 1) return prev;
          return prev.filter((sbId) => sbId !== idOrIds);
        }
        // No limit on max selections
        return [...prev, idOrIds];
      });
    }
  };

  const selectAll = () => {
    // Select all books with no limit
    setSelectedSportsbooks(defaultSportsbooks.map((sb) => sb.id));
  };

  const clearAll = () => {
    // Set to first default selection when clearing
    setSelectedSportsbooks([DEFAULT_SELECTIONS[0]]);
  };

  // Set the user's state
  const setUserStateCode = (stateCode: string) => {
    // Validate and normalize state code
    const normalizedCode = stateCode.toUpperCase();
    if (Object.values(STATE_CODES).includes(normalizedCode)) {
      setUserState(normalizedCode);
      return true;
    }
    return false;
  };

  // Check if sports betting is legal in the user's state
  const isBettingLegalInUserState = () => {
    return LEGAL_BETTING_STATES.includes(userState);
  };

  // Format a sportsbook URL with the user's state
  const formatSportsbookUrl = (
    sportsbookId: string,
    params: Record<string, string> = {}
  ) => {
    const sportsbook = defaultSportsbooks.find((sb) => sb.id === sportsbookId);
    if (!sportsbook || !sportsbook.url) return "";

    let url = sportsbook.url;

    // Replace state placeholder if needed
    if (sportsbookId === "betrivers") {
      url = `https://${userState.toLowerCase()}.betrivers.com/?page=sportsbook`;

      // Add event parameters if provided
      if (params.eventId) {
        url += `#event/${params.eventId}`;

        // Add coupon parameters if provided
        if (params.pickType && params.selectionId && params.wagerAmount) {
          url += `?coupon=${params.pickType}|${params.selectionId}|${params.wagerAmount}`;
        }
      }
    } else if (sportsbookId === "betmgm") {
      url = `https://sports.${userState.toLowerCase()}.betmgm.com/en/sports`;

      // Add options parameter if provided
      if (params.options) {
        url += `?options=${params.options}&type=Single`;
      }
    }

    return url;
  };

  return {
    selectedSportsbooks,
    toggleSportsbook,
    selectAll,
    clearAll,
    maxSelections: defaultSportsbooks.length, // Return total number of sportsbooks instead of fixed limit
    userState,
    setUserState: setUserStateCode,
    isBettingLegalInUserState,
    formatSportsbookUrl,
  };
}
