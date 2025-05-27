"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchHitRateProfiles } from "@/services/hit-rates"
import { fetchMockHitRateProfiles } from "@/services/mock-hit-rates"
import { fetchPlayerTeamData } from "@/services/teams"
import { fetchBestOddsForHitRateProfiles, PlayerPropOdds } from "@/services/player-prop-odds"
import type { PlayerHitRateProfile, HitRateFilters as HitRateFiltersType, Market, TimeWindow } from "@/types/hit-rates"
import { MoonIcon, SunIcon, Grid, List, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import HitRateCardV2 from "./hit-rate-card-v2"
import HitRateTableV2 from "./hit-rate-table-v2"
import HitRateFiltersV2 from "./hit-rate-filters-v2"
import { useMediaQuery } from "@/hooks/use-media-query"


// Default filters with "Hits" market selected
const defaultFilters: HitRateFiltersType = {
  market: "Hits",
  timeWindow: "10_games",
  minHitRate: 0.5,
}

// Add interface for player team data
interface PlayerTeamData {
  player_id: number
  team_abbreviation: string
  team_name: string
  position_abbreviation: string
}

// Add interface for game info
interface GameInfo {
  odds_event_id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  display_name?: string;
}

type ViewMode = "table" | "grid"

export default function HitRateDashboardV2() {
  const [profiles, setProfiles] = useState<PlayerHitRateProfile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<PlayerHitRateProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "grid" : "table")
  const [useMockData, setUseMockData] = useState(false)
  const [customTier, setCustomTier] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState<HitRateFiltersType>(defaultFilters)
  const [playerTeamData, setPlayerTeamData] = useState<Record<number, PlayerTeamData>>({})
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [playerOddsData, setPlayerOddsData] = useState<Record<string, PlayerPropOdds | null>>({})
  const [selectedGames, setSelectedGames] = useState<string[] | null>(null) // Add state for game filtering
  const itemsPerPage = 12
  
  // Available markets for quick selection
  const availableMarkets: { value: Market; label: string }[] = [
    { value: "Hits", label: "Hits" },
    { value: "Total Bases", label: "Total Bases" },
    { value: "Home Runs", label: "Home Runs" },
    { value: "Strikeouts", label: "Strikeouts" },
    { value: "Walks", label: "Walks" },
    { value: "Outs", label: "Outs" },
    { value: "RBIs", label: "RBIs" },
    { value: "Singles", label: "Singles" },
    { value: "Doubles", label: "Doubles" },
    { value: "Triples", label: "Triples" },
    { value: "Earned Runs", label: "Earned Runs" },
    { value: "Record Win", label: "Record Win" },
    { value: "Batting Strikeouts", label: "Batting Strikeouts" },
    { value: "Batting Walks", label: "Batting Walks" },
    { value: "Hits + Runs + RBIs", label: "Hits + Runs + RBIs" },
  ]
  
  // Set a constant activeTimeWindow to 10_games - we now always show up to 10 games
  // instead of allowing users to switch between different time windows
  const activeTimeWindow: TimeWindow = "10_games"

  // State for table sorting
  const [tableSortField, setTableSortField] = useState<string>("L10")
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("desc")

  // Extract unique games from profiles
  const availableGames = useMemo<GameInfo[]>(() => {
    if (!profiles.length) return [];
    
    const gamesMap = new Map<string, GameInfo>();
    
    profiles.forEach((profile) => {
      // Skip if missing required fields
      if (!profile.odds_event_id || !profile.home_team || !profile.away_team || !profile.commence_time) {
        return;
      }
      
      if (!gamesMap.has(profile.odds_event_id)) {
        const gameDate = new Date(profile.commence_time);
        const formattedTime = gameDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true
        });
        
        const formattedDate = gameDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
        
        gamesMap.set(profile.odds_event_id, {
          odds_event_id: profile.odds_event_id,
          home_team: profile.home_team,
          away_team: profile.away_team,
          commence_time: profile.commence_time,
          display_name: `${profile.away_team} @ ${profile.home_team} - ${formattedDate} ${formattedTime}`
        });
      }
    });
    
    // Convert map to array and sort by time (recent games first)
    return Array.from(gamesMap.values())
      .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
  }, [profiles]);

  // Update view mode when screen size changes
  useEffect(() => {
    setViewMode(isMobile ? "grid" : "table");
  }, [isMobile]);

  // Button to sort all stats at once
  const sortButtonText = tableSortDirection === "desc" ? "Highest First" : "Lowest First"

  // Fetch profiles and odds data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // First load hit rate profiles
        const profilesData = await fetchHitRateProfiles();
        setProfiles(profilesData);
        console.log(`[DASHBOARD] Loaded ${profilesData.length} hit rate profiles`);
        
        // Default filtering and sorting
        // Apply filters manually instead of using a non-existent function
        const filtered = profilesData.filter(profile => {
          // Apply market filter if set
          if (activeFilters.market && profile.market !== activeFilters.market) return false;
          
          // Apply team filter if set
          if (activeFilters.team && profile.team_name !== activeFilters.team) return false;
          
          // Apply min hit rate filter if set
          if (activeFilters.minHitRate) {
            const hitRate = calculateHitRate(profile, activeFilters.timeWindow || "10_games");
            if (hitRate < activeFilters.minHitRate) return false;
          }
          
          return true;
        });
        
        const sorted = sortProfiles(filtered);
        setFilteredProfiles(sorted);
        
        // Check if profiles already have all_odds data
        const hasAllOddsData = profilesData.length > 0 && profilesData[0].all_odds;
        
        // Only fetch odds data if profiles don't already have it
        if (!hasAllOddsData) {
          console.log("[DASHBOARD] Profiles don't have all_odds data, fetching separate odds data");
          await fetchOddsDataForProfiles(profilesData);
        } else {
          console.log("[DASHBOARD] Profiles already have all_odds data, skipping odds fetch");
        }
        
        // Fetch player metadata (team, position, etc)
        // Pass player IDs instead of profiles to match the function's parameter type
        const playerIds = profilesData.map(profile => profile.player_id);
        console.log(`[DASHBOARD] Fetching team data for ${playerIds.length} players in initial load`);
        
        const teamData = await fetchPlayerTeamData(playerIds);
        console.log(`[DASHBOARD] Received team data for ${Object.keys(teamData).length} players in initial load`);
        
        // Log a sample of the data received
        const samplePlayerIds = Object.keys(teamData).slice(0, 3);
        if (samplePlayerIds.length > 0) {
          samplePlayerIds.forEach(id => {
            const playerData = teamData[Number(id)];
            console.log(`[DASHBOARD] Sample player ${id} data:`, 
              playerData ? `${playerData.team_abbreviation}, ${playerData.position_abbreviation}` : 'No data');
          });
        }
        
        setPlayerTeamData(teamData);
        
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load hit rate data");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activeFilters]);

  // Handle game filter change
  const handleGameFilterChange = (gameIds: string[] | null) => {
    console.log("Game filter changed:", gameIds);
    setSelectedGames(gameIds);
    setCurrentPage(1); // Reset to first page when filter changes
  }

  // Apply filters, search, and sorting
  useEffect(() => {
    let results = [...profiles]
    console.log("Filtering with custom tier:", customTier, "and market:", activeFilters.market)
    
    // Apply active filters
    if (activeFilters.team) {
      results = results.filter((profile) => profile.team_name === activeFilters.team)
    }

    if (activeFilters.market) {
      results = results.filter((profile) => profile.market === activeFilters.market)
    } else {
      // Default to Hits if no market is selected
      results = results.filter((profile) => profile.market === "Hits")
    }
    
    // Apply game filter if selected
    if (selectedGames && selectedGames.length > 0) {
      results = results.filter((profile) => 
        profile.odds_event_id && selectedGames.includes(profile.odds_event_id)
      );
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (profile) =>
          profile.player_name.toLowerCase().includes(query) ||
          (profile.team_name && profile.team_name.toLowerCase().includes(query)),
      )
    }
    
    // Sort the results
    results = sortProfiles(results)
    
    setFilteredProfiles(results)
    setCurrentPage(1) // Reset to first page when filters change
  }, [profiles, activeFilters, searchQuery, customTier, tableSortField, tableSortDirection, selectedGames])

  // Monitor active filters changes
  useEffect(() => {
    console.log("Active market changed:", activeFilters.market)
  }, [activeFilters.market])

  // Handle market selection
  const handleMarketSelect = (market: Market) => {
    console.log(`Market selected: ${market}`)
    setLoading(true)
    
    // Create a new filters object with the selected market
    const newFilters = { ...activeFilters, market: market }
    
    // Log all profiles to see what markets are available
    const marketCounts = profiles.reduce((acc: Record<string, number>, profile) => {
      const mkt = profile.market;
      acc[mkt] = (acc[mkt] || 0) + 1;
      return acc;
    }, {});
    console.log("Available markets and counts in profiles:", marketCounts);
    
    // Apply the new filters
    try {
      // Find profiles matching the selected market
      const marketProfiles = profiles.filter(profile => profile.market === market)
      console.log(`Found ${marketProfiles.length} profiles for market "${market}"`)
      
      if (marketProfiles.length === 0) {
        // Log examples of profile markets to verify they exist
        const marketSamples = profiles.slice(0, 5).map(p => p.market);
        console.log("Sample markets in profiles:", marketSamples);
        
        // Check for whitespace or case sensitivity issues
        const similarProfiles = profiles.filter(p => 
          p.market.toLowerCase().trim() === market.toLowerCase().trim()
        );
        
        if (similarProfiles.length > 0) {
          console.log("Found profiles with case-insensitive/trimmed match:", similarProfiles.length);
          console.log("First match market value:", similarProfiles[0].market);
          
          // Try using the exact market string from the database
          const exactMarket = similarProfiles[0].market;
          console.log(`Using exact market string from database: "${exactMarket}"`);
          
          // Filter again using the exact market string
          const exactMarketProfiles = profiles.filter(profile => profile.market === exactMarket);
          console.log(`Found ${exactMarketProfiles.length} profiles for exact market "${exactMarket}"`);
          
          // If we find profiles using the exact string, use these instead
          if (exactMarketProfiles.length > 0) {
            setActiveFilters({...activeFilters, market: exactMarket});
            
            // Continue processing with these profiles
            let filtered = [...exactMarketProfiles];
            
            // Apply remaining filters...
            if (newFilters.team) {
              filtered = filtered.filter(profile => profile.team_name === newFilters.team)
            }
            
            if (newFilters.minHitRate && newFilters.timeWindow) {
              const hitRateField = newFilters.timeWindow === "5_games"
                ? "last_5_hit_rate"
                : newFilters.timeWindow === "10_games"
                  ? "last_10_hit_rate"
                  : "last_20_hit_rate"
                
              filtered = filtered.filter(profile => {
                const hitRate = profile[hitRateField as keyof PlayerHitRateProfile] as number
                return hitRate >= newFilters.minHitRate! * 100
              })
            }
            
            // Apply search filter if it exists
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase()
              filtered = filtered.filter(
                profile =>
                  profile.player_name.toLowerCase().includes(query) ||
                  (profile.team_name && profile.team_name.toLowerCase().includes(query))
              )
            }
            
            // Sort the filtered results
            filtered = sortProfiles(filtered)
            
            setFilteredProfiles(filtered)
            setCurrentPage(1)
            setCustomTier(null)
            setLoading(false)
            return; // Exit early since we handled the case
          }
        }
      }
      
      // Update active filters
      setActiveFilters(newFilters)
      
      // Update filtered profiles
      if (marketProfiles.length > 0) {
        // Apply any other active filters (team, minimum hit rate)
        let filtered = [...marketProfiles]
        
        if (newFilters.team) {
          filtered = filtered.filter(profile => profile.team_name === newFilters.team)
        }
        
        if (newFilters.minHitRate && newFilters.timeWindow) {
          const hitRateField = newFilters.timeWindow === "5_games"
            ? "last_5_hit_rate"
            : newFilters.timeWindow === "10_games"
              ? "last_10_hit_rate"
              : "last_20_hit_rate"
            
          filtered = filtered.filter(profile => {
            const hitRate = profile[hitRateField as keyof PlayerHitRateProfile] as number
            return hitRate >= newFilters.minHitRate! * 100
          })
        }
        
        // Apply search filter if it exists
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            profile =>
              profile.player_name.toLowerCase().includes(query) ||
              (profile.team_name && profile.team_name.toLowerCase().includes(query))
          )
        }
        
        // Sort the filtered results
        filtered = sortProfiles(filtered)
        
        setFilteredProfiles(filtered)
      } else {
        setFilteredProfiles([])
      }
      
      // Reset pagination
      setCurrentPage(1)
      
      // Reset custom tier since it's market-specific
      setCustomTier(null)
    } catch (err) {
      console.error(`Error filtering for market "${market}":`, err)
      setError(`Error filtering for market "${market}"`)
    } finally {
      setLoading(false)
    }
  }

  // Filter change handler
  const handleFilterChange = (filters: HitRateFiltersType) => {
    try {
      console.log("Applying filters:", filters)
      setActiveFilters(filters)
      
      // Apply filters to profiles
      let filtered = [...profiles]
      console.log("Starting with", filtered.length, "profiles")

      if (filters.team) {
        filtered = filtered.filter((profile) => profile.team_name === filters.team)
        console.log("After team filter:", filtered.length, "profiles")
      }

      if (filters.market) {
        // Log the market we're filtering for and the markets available
        const availableMarkets = profiles.reduce((acc: Market[], profile) => {
          if (!acc.includes(profile.market)) {
            acc.push(profile.market)
          }
          return acc
        }, [])
        console.log(`Filtering for market "${filters.market}" among available markets:`, availableMarkets)
        
        filtered = filtered.filter((profile) => profile.market === filters.market)
        console.log("After market filter:", filtered.length, "profiles")
        // Reset custom tier when market changes
        setCustomTier(null)
      } else {
        // Default to Hits if no market is selected
        filtered = filtered.filter((profile) => profile.market === "Hits")
        console.log("Defaulting to Hits market:", filtered.length, "profiles")
      }

      if (filters.minHitRate && filters.timeWindow) {
        const hitRateField =
          filters.timeWindow === "5_games"
            ? "last_5_hit_rate"
            : filters.timeWindow === "10_games"
              ? "last_10_hit_rate"
              : "last_20_hit_rate"

        filtered = filtered.filter((profile) => {
          const hitRate = profile[hitRateField as keyof PlayerHitRateProfile] as number
          return hitRate >= filters.minHitRate! * 100 // Convert from decimal to percentage
        })
        console.log("After hit rate filter:", filtered.length, "profiles")
      }

      // Apply search filter if query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (profile) =>
            profile.player_name.toLowerCase().includes(query) ||
            (profile.team_name && profile.team_name.toLowerCase().includes(query))
        )
        console.log("After search filter:", filtered.length, "profiles")
      }

      // Sort the filtered results
      filtered = sortProfiles(filtered)

      setFilteredProfiles(filtered)
      setCurrentPage(1) // Reset to first page when filters change
    } catch (err: any) {
      console.error("Error applying filters:", err)
      setError(`Error applying filters: ${err.message}`)
    }
  }

  // Custom tier options based on market
  const getCustomTierOptions = (market: string) => {
    switch (market) {
      case "Hits":
        return [1, 2, 3]
      case "Total Bases":
        return [2, 3, 4, 5]
      case "Home Runs":
        return [1, 2]
      case "Strikeouts":
        return [5, 6, 7, 8, 9, 10]
      case "RBIs":
        return [1, 2, 3]
      case "Singles":
        return [1, 2, 3]
      case "Hits + Runs + RBIs":
        return [1, 2, 3,4,5,6]
      default:
        return [1, 2, 3]
    }
  }

  const refreshData = async () => {
    try {
      setLoading(true)
      
      // Create a modified filter without market constraint to load all markets
      const baseFilter = { ...defaultFilters }
      delete baseFilter.market // Remove market filter to get all markets
      
      const data = await fetchHitRateProfiles(baseFilter)
      console.log(`Fetched ${data.length} profiles with all markets`)
      
      // Log the unique markets found in the data
      const markets = data.reduce((acc: Market[], profile) => {
        if (!acc.includes(profile.market)) {
          acc.push(profile.market)
        }
        return acc
      }, [])
      console.log("Available markets in data:", markets)
      
      // Before setting profiles, let's try to fix any whitespace or case issues in market names
      const normalizedData = data.map(profile => ({
        ...profile,
        market: profile.market.trim() as Market // Trim any whitespace
      }));
      
      // Regenerate the market list with normalized markets
      const normalizedMarkets = normalizedData.reduce((acc: Market[], profile) => {
        if (!acc.includes(profile.market)) {
          acc.push(profile.market)
        }
        return acc
      }, []);
      console.log("Normalized markets in data:", normalizedMarkets);
      
      setProfiles(normalizedData)
      
      // Filter for the currently selected market
      if (activeFilters.market) {
        const marketProfiles = normalizedData.filter(profile => profile.market === activeFilters.market)
        console.log(`Filtered to ${marketProfiles.length} profiles for market "${activeFilters.market}"`)
        
        if (marketProfiles.length === 0) {
          // Try case-insensitive matching if exact match fails
          const caseInsensitiveMarketProfiles = normalizedData.filter(
            profile => profile.market.toLowerCase() === activeFilters.market.toLowerCase()
          );
          
          if (caseInsensitiveMarketProfiles.length > 0) {
            // Use the actual market string from the first profile
            const actualMarket = caseInsensitiveMarketProfiles[0].market;
            console.log(`Using case-corrected market: "${actualMarket}" instead of "${activeFilters.market}"`);
            
            setActiveFilters({...activeFilters, market: actualMarket});
            setFilteredProfiles(caseInsensitiveMarketProfiles);
          } else {
            // If still no match, default to "Hits"
            console.log(`No profiles found for market "${activeFilters.market}", defaulting to "Hits"`);
            const defaultMarketProfiles = normalizedData.filter(profile => profile.market === "Hits");
            setActiveFilters({...activeFilters, market: "Hits"});
            setFilteredProfiles(defaultMarketProfiles);
          }
        } else {
          setFilteredProfiles(marketProfiles);
        }
      } else {
        // Default to "Hits" if no market is selected
        const defaultMarketProfiles = normalizedData.filter(profile => profile.market === "Hits")
        setFilteredProfiles(defaultMarketProfiles)
        console.log(`Filtered to ${defaultMarketProfiles.length} profiles for default market "Hits"`)
      }
      
      // Fetch team and odds data for these profiles
      await fetchTeamDataForPlayers(normalizedData);
      await fetchOddsDataForProfiles(normalizedData);
      
      setUseMockData(false)
      setError(null)
      setCurrentPage(1) // Reset to first page when refreshing data
    } catch (err: any) {
      console.error("Error refreshing data:", err)
      setError("Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }

  // Get the current market from filtered profiles
  const getCurrentMarket = () => {
    if (filteredProfiles.length > 0) {
      return filteredProfiles[0].market
    }
    return defaultFilters.market || "Hits"
  }

  // Function to calculate hit rate with a custom tier
  const calculateHitRateWithCustomTier = (profile: PlayerHitRateProfile, customTier: number, timeWindow: "last_5" | "last_10" | "last_20"): number => {
    // Get the histogram data for the specified time window
    const histogram = profile.points_histogram[timeWindow];
    
    // Calculate total games and games where the player hit the custom tier
    const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0);
    
    if (totalGames === 0) return 0;
    
    // Calculate games where player had >= custom tier
    let gamesHittingTier = 0;
    Object.entries(histogram).forEach(([value, count]) => {
      if (Number(value) >= customTier) {
        gamesHittingTier += count;
      }
    });
    
    // Calculate and return the hit rate percentage
    return Math.round((gamesHittingTier / totalGames) * 100);
  }

  // Calculate hit rate for a profile based on time window and custom tier
  const calculateHitRate = (profile: PlayerHitRateProfile, timeWindow: string): number => {
    // If we have a custom tier, use the custom calculation
    if (customTier !== null) {
      const windowKey = timeWindow === "5_games" ? "last_5" : timeWindow === "10_games" ? "last_10" : "last_20";
      return calculateHitRateWithCustomTier(profile, customTier, windowKey);
    }
    
    // Otherwise, use the standard hit rates
    if (timeWindow === "5_games") {
      return profile.last_5_hit_rate;
    } else if (timeWindow === "10_games") {
      return profile.last_10_hit_rate;
    } else if (timeWindow === "20_games") {
      return profile.last_20_hit_rate;
    }
    return profile.last_10_hit_rate; // Default to last 10 games
  }

  // Update the sortProfiles function to use the table sort field
  const sortProfiles = (profiles: PlayerHitRateProfile[]): PlayerHitRateProfile[] => {
    return [...profiles].sort((a, b) => {
      let result = 0;

      // Sort based on the selected field
      switch (tableSortField) {
        case "name": {
          result = a.player_name.localeCompare(b.player_name);
          break;
        }
        case "line": {
          result = a.line - b.line;
          break;
        }
        case "hitRate": {
          const aHitRate = calculateHitRate(a, activeTimeWindow);
          const bHitRate = calculateHitRate(b, activeTimeWindow);
          result = aHitRate - bHitRate;
          break;
        }
        case "L5": {
          result = a.last_5_hit_rate - b.last_5_hit_rate;
          break;
        }
        case "L5_custom": {
          const aL5CustomRate = calculateHitRateWithCustomTier(a, customTier!, "last_5");
          const bL5CustomRate = calculateHitRateWithCustomTier(b, customTier!, "last_5");
          result = aL5CustomRate - bL5CustomRate;
          break;
        }
        case "L10": {
          result = a.last_10_hit_rate - b.last_10_hit_rate;
          break;
        }
        case "L10_custom": {
          const aL10CustomRate = calculateHitRateWithCustomTier(a, customTier!, "last_10");
          const bL10CustomRate = calculateHitRateWithCustomTier(b, customTier!, "last_10");
          result = aL10CustomRate - bL10CustomRate;
          break;
        }
        case "L20": {
          result = a.last_20_hit_rate - b.last_20_hit_rate;
          break;
        }
        case "L20_custom": {
          const aL20CustomRate = calculateHitRateWithCustomTier(a, customTier!, "last_20");
          const bL20CustomRate = calculateHitRateWithCustomTier(b, customTier!, "last_20");
          result = aL20CustomRate - bL20CustomRate;
          break;
        }
        case "seasonHitRate": {
          const aSeasonRate = a.season_hit_rate || 0;
          const bSeasonRate = b.season_hit_rate || 0;
          result = aSeasonRate - bSeasonRate;
          break;
        }
        case "average": {
          result = a.avg_stat_per_game - b.avg_stat_per_game;
          break;
        }
        default: {
          const aDefaultRate = calculateHitRate(a, activeTimeWindow);
          const bDefaultRate = calculateHitRate(b, activeTimeWindow);
          result = aDefaultRate - bDefaultRate;
        }
      }
      
      // Apply the sort direction
      return tableSortDirection === "asc" ? result : -result;
    })
  }

  // Handler for table sort
  const handleTableSort = (field: string, direction: "asc" | "desc") => {
    setTableSortField(field);
    setTableSortDirection(direction);
    
    // Apply the sort immediately
    const sorted = sortProfiles(filteredProfiles);
    setFilteredProfiles(sorted);
  }

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProfiles, currentPage, itemsPerPage])

  // Generate pagination items
  const getPaginationItems = () => {
    const items = []
    const maxPagesToShow = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => setCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }
    
    return items
  }

  // Update the fetchTeamDataForPlayers function to fix the Set iteration error
  const fetchTeamDataForPlayers = async (profiles: PlayerHitRateProfile[]) => {
    try {
      // Extract unique player IDs
      const playerIds = Array.from(new Set(profiles.map((profile) => profile.player_id)))
      
      console.log(`[DASHBOARD] Fetching team data for ${playerIds.length} unique players`, 
        playerIds.length > 0 ? `First few: ${playerIds.slice(0, 3).join(", ")}` : "No players");
      
      // Fetch team data for these players
      const teamData = await fetchPlayerTeamData(playerIds)
      
      console.log(`[DASHBOARD] Received team data for ${Object.keys(teamData).length} players`);
      
      if (Object.keys(teamData).length === 0) {
        console.warn("[DASHBOARD] Warning: No player team data received from API!");
      } else {
        // Log a sample of the data received
        const samplePlayerIds = Object.keys(teamData).slice(0, 3);
        samplePlayerIds.forEach(id => {
          const playerData = teamData[Number(id)];
          console.log(`[DASHBOARD] Sample player ${id} data:`, 
            playerData ? `${playerData.team_abbreviation}, ${playerData.position_abbreviation}` : 'No data');
        });
      }
      
      setPlayerTeamData(teamData);
      
      // Debug: Check what's in playerTeamData immediately after setting it
      console.log(`[DASHBOARD] playerTeamData count after setting:`, 
        Object.keys(playerTeamData).length);
      if (Object.keys(playerTeamData).length === 0) {
        console.warn("[DASHBOARD] Warning: playerTeamData is empty after setting it!");
      }
      
    } catch (err) {
      console.error("Failed to fetch player team data:", err)
    }
  }

  // Helper function to get team abbreviation and position for a player
  const getPlayerData = (playerId: number) => {
    const data = playerTeamData[playerId]
    
    // Debug log to check what data we have
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DASHBOARD] getPlayerData for player ${playerId}:`, 
        data ? `Found: ${data.team_abbreviation}, ${data.position_abbreviation}` : 'Not found in playerTeamData');
    }
    
    if (data) {
      return {
        teamAbbreviation: data.team_abbreviation,
        positionAbbreviation: data.position_abbreviation,
      }
    }
    
    // Look for the player in the profiles to get team name for fallback
    const playerProfile = profiles.find((p) => p.player_id === playerId)
    let teamAbbr = "—"
    
    // Generate a fallback abbreviation from team_name if available
    if (playerProfile?.team_name) {
      teamAbbr = playerProfile.team_name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DASHBOARD] Generated fallback team abbreviation for ${playerId}: ${teamAbbr} from ${playerProfile.team_name}`);
      }
    }
    
    // Fallback if player data not found
    return {
      teamAbbreviation: teamAbbr,
      positionAbbreviation: "—",
    }
  }

  // Generate random odds for demonstration
  const getRandomOdds = () => {
    const baseOdds = Math.random() > 0.5 ? -110 : 110
    const variation = Math.floor(Math.random() * 20) * 5
    return baseOdds > 0 ? baseOdds + variation : baseOdds - variation
  }

  // Get random sportsbook for demonstration
  const getRandomSportsbook = () => {
    const books = ["DK", "FD", "MGM", "CZR"]
    return books[Math.floor(Math.random() * books.length)]
  }

  // Get the best odds for a player profile
  const getBestOddsForProfile = (profile: PlayerHitRateProfile) => {
    // First check if all_odds field is available and has data for this line
    if (profile.all_odds && profile.line && profile.all_odds[profile.line.toString()]) {
      // Use all_odds data
      const lineOdds = profile.all_odds[profile.line.toString()];
      const bookmakers = Object.keys(lineOdds);
      
      if (bookmakers.length > 0) {
        // Find the best odds (highest value)
        let bestSportsbook = bookmakers[0];
        let bestOddsValue = Number(lineOdds[bestSportsbook].odds);
        
        bookmakers.forEach(book => {
          const currentOdds = Number(lineOdds[book].odds);
          if (currentOdds > bestOddsValue) {
            bestOddsValue = currentOdds;
            bestSportsbook = book;
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DASHBOARD] Using all_odds data for ${profile.player_name} (${profile.market} ${profile.line}): ${bestSportsbook} ${bestOddsValue}`);
        }
        
        return {
          american: bestOddsValue,
          decimal: americanToDecimal(bestOddsValue),
          sportsbook: bestSportsbook,
          link: lineOdds[bestSportsbook].over_link || null
        };
      }
    }
    
    // Fall back to previous odds data if all_odds not available
    // Create the key to look up in the odds data
    const profileKey = `${profile.id}:${profile.market}:${profile.line}`;
    const oddsData = playerOddsData[profileKey];
    
    if (process.env.NODE_ENV === 'development') {
      // Only log in development to avoid console spam in production
      const exists = !!oddsData;
      console.log(`[DASHBOARD] Looking up odds for ${profileKey}: ${exists ? "FOUND" : "NOT FOUND"}`);
      
      if (exists && oddsData?.over_odds !== null) {
        console.log(`[DASHBOARD] Odds for ${profile.player_name} (${profile.market} ${profile.line}): ${oddsData.sportsbook} ${oddsData.over_odds}`);
      }
    }
    
    if (oddsData && oddsData.over_odds !== null) {
      return {
        american: oddsData.over_odds,
        decimal: americanToDecimal(oddsData.over_odds),
        sportsbook: oddsData.sportsbook,
        link: oddsData.over_link
      }
    }
    
    // Return null if no odds data found
    return null;
  }
  
  // Helper function to convert American odds to decimal
  const americanToDecimal = (american: number | null): number => {
    if (american === null) return 1.0;
    
    if (american > 0) {
      return Number(((american / 100) + 1).toFixed(2));
    } else {
      return Number((100 / Math.abs(american) + 1).toFixed(2));
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearchExpanded(false)
  }

  // Convert our data model to the V0 expected format
  const convertToV0Format = (profile: PlayerHitRateProfile) => {
    const playerData = getPlayerData(profile.player_id);
    const teamAbbreviation = playerData?.teamAbbreviation || profile.team_name;
    const positionAbbreviation = playerData?.positionAbbreviation || "N/A";
    
    // Generate MLB headshot URL
    const playerHeadshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${profile.player_id}/headshot/67/current`
    
    // Generate random game info (in a real app, this would come from the API)
    const teams = ["NYY", "BOS", "LAD", "CHC", "MIL", "ATL", "HOU", "PHI"]
    const randomTeam = teams[Math.floor(Math.random() * teams.length)]
    
    // Get the best odds for this profile
    const bestOdds = getBestOddsForProfile(profile)
    
    // Create a safe key for the stats object
    const marketKey = profile.market.toLowerCase().replace(/\s+/g, "_") as string
    
    // Define the stats type explicitly
    type StatType = {
      marketLine: number
      hitRates: {
        l5: number
        l10: number
        l20: number
      }
      lastGames: any[]
      trend: string
      average: number
    }
    
    // Create the stats object with proper typing
    const stats: Record<string, StatType> = {
      [marketKey]: {
        marketLine: profile.line,
        hitRates: {
          l5: profile.last_5_hit_rate / 100, // Convert to decimal
          l10: profile.last_10_hit_rate / 100,
          l20: profile.last_20_hit_rate / 100,
        },
        lastGames: [], // We'd need to fetch this separately
        trend: profile.last_5_hit_rate > profile.last_10_hit_rate ? "up" : 
               profile.last_5_hit_rate < profile.last_10_hit_rate ? "down" : "neutral",
        average: profile.avg_stat_per_game,
      }
    }
    
    return {
      id: profile.id.toString(),
      name: profile.player_name,
      position: positionAbbreviation,
      team: {
        name: teamAbbreviation,
        logo: `/placeholder.svg?height=24&width=24`,
      },
      avatar: playerHeadshotUrl,
      matchup: `vs ${randomTeam}`,
      stats,
      bestOdds: bestOdds ? bestOdds.american : null,
      sportsbook: {
        name: bestOdds?.sportsbook || "—",
        logo: `/placeholder.svg?height=24&width=60`,
        link: bestOdds?.link || "#",
      },
    }
  }

  // Toggle sort order (for backward compatibility with grid view)
  const toggleSortOrder = () => {
    // When using the button, just toggle between ascending and descending on current field
    setTableSortDirection(tableSortDirection === "desc" ? "asc" : "desc")
  }

  // Function to fetch odds data for profiles
  const fetchOddsDataForProfiles = async (profiles: PlayerHitRateProfile[]) => {
    try {
      console.log("[DASHBOARD] Fetching odds data for", profiles.length, "profiles");

      // Instead of fetching all at once, split into smaller batches
      // to avoid hitting the 1MB request body limit
      const batchSize = 50; // Process in smaller batches
      const batches = [];
      
      // Split profiles into batches
      for (let i = 0; i < profiles.length; i += batchSize) {
        batches.push(profiles.slice(i, i + batchSize));
      }
      
      console.log(`[DASHBOARD] Split ${profiles.length} profiles into ${batches.length} batches of max ${batchSize}`);
      
      // Process each batch and combine results
      const allOddsData: Record<string, PlayerPropOdds | null> = {};
      
      // Process batches sequentially to avoid overwhelming the server
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`[DASHBOARD] Processing batch ${i+1}/${batches.length} with ${batch.length} profiles`);
        
        const batchOddsData = await fetchBestOddsForHitRateProfiles(batch);
        
        // Merge the batch results into the complete results
        Object.assign(allOddsData, batchOddsData);
        
        // Log match/mismatch count for this batch
        const batchMatches = Object.values(batchOddsData).filter(v => v !== null).length;
        const batchMismatches = Object.values(batchOddsData).filter(v => v === null).length;
        console.log(`[DASHBOARD] Batch ${i+1} results: Matching odds: ${batchMatches}, Missing odds: ${batchMismatches}`);
        
        // Add a small delay between batches to prevent rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Log overall match/mismatch count
      const matches = Object.values(allOddsData).filter(v => v !== null).length;
      const mismatches = Object.values(allOddsData).filter(v => v === null).length;
      console.log(`[DASHBOARD] Total results: Matching odds: ${matches}, Missing odds: ${mismatches}`);
      
      setPlayerOddsData(allOddsData);
    } catch (err) {
      console.error("Failed to fetch odds data:", err);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Player Hit Rates</h1>
          <p className="text-muted-foreground">
            Detailed hit rate analysis and trends. For quick research and daily props, check out our{" "}
            <a href="/hit-sheets" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 underline">
              Hit Sheets
            </a>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          {useMockData && (
            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
              <AlertTriangle size={12} className="mr-1" />
              Using mock data
            </Badge>
          )}
          
          
        </div>
      </div>

      {/* Filters Component */}
      <HitRateFiltersV2 
        onMarketChange={(market: Market) => handleMarketSelect(market)}
        onViewModeChange={setViewMode}
        onSearchChange={setSearchQuery}
        onSortChange={handleTableSort}
        onGameFilterChange={handleGameFilterChange}
        currentMarket={activeFilters.market || "Hits"}
        currentViewMode={viewMode}
        searchQuery={searchQuery}
        availableMarkets={availableMarkets}
        availableGames={availableGames}
        selectedGames={selectedGames}
        onRefreshData={refreshData}
        isLoading={loading}
        currentSortField={tableSortField}
        currentSortDirection={tableSortDirection}
        customTier={customTier}
        setCustomTier={setCustomTier}
        getCustomTierOptions={getCustomTierOptions}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && !useMockData && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          <h3 className="font-bold text-lg">Error Loading Data</h3>
          <p>{error}</p>
          {errorDetails && (
            <div className="mt-2">
              <p className="font-semibold text-sm">Error Details:</p>
              <pre className="bg-red-50 dark:bg-red-900/50 p-2 rounded text-xs overflow-auto mt-1 max-h-32">
                {errorDetails}
              </pre>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setProfiles(fetchMockHitRateProfiles(defaultFilters))
                setFilteredProfiles(fetchMockHitRateProfiles(defaultFilters))
                setUseMockData(true)
                setError(null)
              }}
            >
              Use Mock Data
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProfiles.length === 0 && (
        <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-600 dark:text-gray-300">No Hit Rate Profiles Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search query.</p>
        </div>
      )}

      {/* Content Views */}
      {!loading && (!error || useMockData) && filteredProfiles.length > 0 && (
        <div className="mt-6">
          {viewMode === "table" ? (
            <HitRateTableV2 
              profiles={paginatedProfiles}
              calculateHitRate={calculateHitRate}
              getPlayerData={getPlayerData}
              activeTimeWindow={activeTimeWindow}
              customTier={customTier}
              onSort={handleTableSort}
              sortField={tableSortField}
              sortDirection={tableSortDirection}
              getBestOddsForProfile={getBestOddsForProfile}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Add a safety limit for grid view to prevent excessive re-renders */}
              {paginatedProfiles.slice(0, 12).map((profile) => (
                <div key={profile.id} className="transition-all duration-200 hover:translate-y-[-4px]">
                  <HitRateCardV2 
                    profile={profile}
                    customTier={customTier}
                    selectedTimeWindow={activeTimeWindow}
                    getPlayerData={getPlayerData}
                    bestOdds={getBestOddsForProfile(profile)}
                  />
                </div>
              ))}
              {paginatedProfiles.length > 12 && (
                <div className="col-span-full py-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Limiting display to first 12 cards to improve performance.
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Switch to table view to see all {paginatedProfiles.length} results.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {getPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </main>
  )
}
