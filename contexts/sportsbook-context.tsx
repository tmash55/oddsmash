"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { sportsbooks } from "@/data/sports-data";

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
  const [userSportsbooks, setUserSportsbooks] = useState<string[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showSportsbookSelector, setShowSportsbookSelector] = useState(false);

  // Load preferences from localStorage on initial render
  useEffect(() => {
    const storedSportsbooks = localStorage.getItem("userSportsbooks");
    const visitStatus = localStorage.getItem("hasVisitedBefore");

    if (storedSportsbooks) {
      setUserSportsbooks(JSON.parse(storedSportsbooks));
    } else {
      // Default to all sportsbooks if none are selected
      setUserSportsbooks(sportsbooks.map((sb) => sb.id));
    }

    if (visitStatus === "true") {
      setIsFirstVisit(false);
    } else {
      // If it's the first visit, show the selector
      setShowSportsbookSelector(true);
      localStorage.setItem("hasVisitedBefore", "true");
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (userSportsbooks.length > 0) {
      localStorage.setItem("userSportsbooks", JSON.stringify(userSportsbooks));
    }
  }, [userSportsbooks]);

  // Add a convenience method to open the selector
  const openSportsbookSelector = () => {
    setShowSportsbookSelector(true);
  };

  return (
    <SportsbookContext.Provider
      value={{
        userSportsbooks,
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
