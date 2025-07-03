"use client";

import { useState, useEffect } from "react";

import { sportsbooks as defaultSportsbooks } from "@/data/sportsbooks";
import { createClient } from "@/libs/supabase/client";

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
  "AZ", "CO", "CT", "DC", "IL", "IN", "IA", "KS", "LA", "MD", 
  "MA", "MI", "NV", "NH", "NJ", "NY", "OH", "OR", "PA", "RI", 
  "TN", "VA", "WV", "WY",
];

export interface UserPreferences {
  state_code: string | null;
  preferred_sportsbooks: string[];
  onboarding_completed: boolean;
  favorite_sports: string[];
  betting_style: string | null;
  experience_level: string | null;
  sportsbooks: string[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  state_code: null,
  preferred_sportsbooks: [],
  onboarding_completed: false,
  favorite_sports: [],
  betting_style: null,
  experience_level: null,
  sportsbooks: []
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  // Load preferences when component mounts
  useEffect(() => {
    checkAuthAndLoadPreferences();
  }, []);

  const checkAuthAndLoadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        await loadPreferences();
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/user/preferences");
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        console.error("Failed to load preferences");
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!isAuthenticated) return false;

    try {
      const updatedPreferences = { ...preferences, ...updates };
      
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPreferences),
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        return true;
      } else {
        console.error("Failed to update preferences");
        return false;
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      return false;
    }
  };

  // Convenience methods for specific updates
  const setUserState = async (stateCode: string) => {
    const normalizedCode = stateCode.toUpperCase();
    if (Object.values(STATE_CODES).includes(normalizedCode)) {
      return await updatePreferences({ state_code: normalizedCode });
    }
    return false;
  };

  const setSportsbooks = async (sportsbooks: string[]) => {
    return await updatePreferences({ preferred_sportsbooks: sportsbooks });
  };

  const completeOnboarding = async () => {
    return await updatePreferences({ onboarding_completed: true });
  };

  const toggleSportsbook = async (sportsbookId: string) => {
    const currentSportsbooks = preferences.preferred_sportsbooks || [];
    let newSportsbooks: string[];

    if (currentSportsbooks.includes(sportsbookId)) {
      // Don't allow removing if it's the last one
      if (currentSportsbooks.length === 1) return false;
      newSportsbooks = currentSportsbooks.filter(id => id !== sportsbookId);
    } else {
      newSportsbooks = [...currentSportsbooks, sportsbookId];
    }

    return await updatePreferences({ preferred_sportsbooks: newSportsbooks });
  };

  const selectAllSportsbooks = async () => {
    const allSportsbookIds = defaultSportsbooks.map(sb => sb.id);
    return await updatePreferences({ preferred_sportsbooks: allSportsbookIds });
  };

  const clearAllSportsbooks = async () => {
    const firstSportsbook = defaultSportsbooks[0]?.id;
    if (firstSportsbook) {
      return await updatePreferences({ preferred_sportsbooks: [firstSportsbook] });
    }
    return false;
  };

  // Utility functions
  const isBettingLegalInUserState = () => {
    return preferences.state_code ? LEGAL_BETTING_STATES.includes(preferences.state_code) : false;
  };

  const formatSportsbookUrl = (
    sportsbookId: string,
    params: Record<string, string> = {}
  ) => {
    const sportsbook = defaultSportsbooks.find((sb) => sb.id === sportsbookId);
    if (!sportsbook || !sportsbook.url || !preferences.state_code) return "";

    let url = sportsbook.url;
    const userState = preferences.state_code.toLowerCase();

    // Replace state placeholder if needed
    if (sportsbookId === "betrivers") {
      url = `https://${userState}.betrivers.com/?page=sportsbook`;
      if (params.eventId) {
        url += `#event/${params.eventId}`;
        if (params.pickType && params.selectionId && params.wagerAmount) {
          url += `?coupon=${params.pickType}|${params.selectionId}|${params.wagerAmount}`;
        }
      }
    } else if (sportsbookId === "betmgm") {
      url = `https://sports.${userState}.betmgm.com/en/sports`;
      if (params.options) {
        url += `?options=${params.options}&type=Single`;
      }
    }

    return url;
  };

  return {
    // Data
    preferences,
    isLoading,
    isAuthenticated,
    
    // State-specific getters for backwards compatibility
    userState: preferences.state_code,
    selectedSportsbooks: preferences.preferred_sportsbooks || [],
    
    // Update methods
    updatePreferences,
    setUserState,
    setSportsbooks,
    completeOnboarding,
    toggleSportsbook,
    selectAllSportsbooks,
    clearAllSportsbooks,
    
    // Utility methods
    isBettingLegalInUserState,
    formatSportsbookUrl,
    
    // Reload data
    refresh: loadPreferences,
  };
}
