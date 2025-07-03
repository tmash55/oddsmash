"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type SportsbookContextType = {
  userSportsbooks: string[];
  setUserSportsbooks: (sportsbooks: string[]) => void;
  isFirstVisit: boolean;
  setIsFirstVisit: (value: boolean) => void;
  showSportsbookSelector: boolean;
  setShowSportsbookSelector: (value: boolean) => void;
  openSportsbookSelector: () => void;
};

const SportsbookContext = createContext<SportsbookContextType | undefined>(
  undefined
);

export function SportsbookProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the new database-backed user preferences hook
  const { selectedSportsbooks, setSportsbooks } = useUserPreferences();

  // Keep the additional state from the original context
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showSportsbookSelector, setShowSportsbookSelector] = useState(false);

  // Create a setter function that works with the hook
  const setUserSportsbooks = (sportsbooks: string[]) => {
    // Use the setSportsbooks function from the hook to update the preferences
    setSportsbooks(sportsbooks);
  };

  // Load first visit status from localStorage on initial render
  useEffect(() => {
    const visitStatus = localStorage.getItem("hasVisitedBefore");

    if (visitStatus === "true") {
      setIsFirstVisit(false);
    } else {
      // If it's the first visit, show the selector
      setShowSportsbookSelector(true);
      localStorage.setItem("hasVisitedBefore", "true");
    }
  }, []);

  // Add a convenience method to open the selector
  const openSportsbookSelector = () => {
    setShowSportsbookSelector(true);
  };

  return (
    <SportsbookContext.Provider
      value={{
        userSportsbooks: selectedSportsbooks, // Use the selectedSportsbooks from the hook
        setUserSportsbooks,
        isFirstVisit,
        setIsFirstVisit,
        showSportsbookSelector,
        setShowSportsbookSelector,
        openSportsbookSelector,
      }}
    >
      {children}
    </SportsbookContext.Provider>
  );
}

export function useSportsbooks() {
  const context = useContext(SportsbookContext);
  if (context === undefined) {
    throw new Error("useSportsbooks must be used within a SportsbookProvider");
  }
  return context;
}
