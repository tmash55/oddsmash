import { getCachedData, setCachedData, generateCacheKey } from "./redis";

// API Types
export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Event {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

export interface OddsResponse {
  success: boolean;
  data: GameOdds[];
}

export interface GameOdds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  sid?: string;
  markets: Market[];
}

export interface Market {
  key: string;
  last_update?: string;
  sid?: string | null;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
  sid?: string;
}

export interface PlayerPropMarket extends Market {
  player: string;
  statType: string;
  line: number;
}

export interface PlayerProp {
  id?: string;
  player: string;
  team?: string;
  statType: string;
  line: number;
  bookmakers: Bookmaker[];
}

// API Configuration
const API_BASE_URL = "https://api.the-odds-api.com/v4";
const API_KEY = process.env.ODDS_API_KEY;

// Mock data flag (from old client)
export let USE_MOCK_DATA = false;

// Check localStorage in client-side environments
if (typeof window !== "undefined") {
  const storedValue = localStorage.getItem("USE_MOCK_DATA");
  USE_MOCK_DATA = storedValue !== null ? storedValue === "true" : false;
}

// Rate limiting variables (from old client)
let lastRequestTime = 0;
let requestCount = 0;

// Error class for API errors
export class OddsAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "OddsAPIError";
  }
}

// Apply rate limiting (from old client)
async function applyRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  // If less than 1 second has passed since the last request, wait
  if (timeSinceLastRequest < 1000) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
}

// Track API request for monitoring (from old client)
function trackRequest() {
  requestCount++;

  // Store the request count in localStorage for the current day
  if (typeof window !== "undefined") {
    const today = new Date().toISOString().split("T")[0];
    const key = `api_requests_${today}`;

    const currentCount = localStorage.getItem(key)
      ? Number.parseInt(localStorage.getItem(key) as string, 10)
      : 0;

    localStorage.setItem(key, (currentCount + 1).toString());
  }
}

// Log API usage information from headers (from old client)
function logApiUsage(remaining: string | null, used: string | null) {
  if (remaining || used) {
    console.info(
      `API Usage - Remaining: ${remaining || "unknown"}, Used: ${
        used || "unknown"
      }`
    );

    // Store in localStorage for the dashboard
    if (typeof window !== "undefined" && remaining) {
      localStorage.setItem("api_remaining_requests", remaining);
    }
  }
}

// Helper function to make API requests
export async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  // Apply rate limiting
  await applyRateLimit();

  // Track this request
  trackRequest();

  const queryParams = new URLSearchParams({
    apiKey: API_KEY!,
    ...params,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams}`);

  // Get remaining requests from headers if available (from old client)
  const remainingRequests = response.headers.get("x-requests-remaining");
  const usedRequests = response.headers.get("x-requests-used");

  if (remainingRequests || usedRequests) {
    logApiUsage(remainingRequests, usedRequests);
  }

  if (!response.ok) {
    // Handle API quota limit (from old client)
    const errorText = await response.text();

    if (response.status === 401 && errorText.includes("OUT_OF_USAGE_CREDITS")) {
      console.warn("API quota reached, using mock data instead");

      // Store in localStorage that we should use mock data
      if (typeof window !== "undefined") {
        localStorage.setItem("USE_MOCK_DATA", "true");
      }

      // Set the flag for the current session
      USE_MOCK_DATA = true;

      // In a real implementation, you would return mock data here
      throw new OddsAPIError("API quota reached", response.status);
    }

    throw new OddsAPIError(`API request failed: ${errorText}`, response.status);
  }

  return response.json();
}

// Function to get available events for a sport
export async function getEvents(
  sportKey: string,
  markets: string[] = []
): Promise<Event[]> {
  // Include markets in the cache key if they exist
  const cacheKeyParts = ["events", sportKey];
  if (markets.length > 0) {
    cacheKeyParts.push("markets", markets.join(","));
  }
  const cacheKey = generateCacheKey(cacheKeyParts);

  // Try to get from cache first
  const cachedData = await getCachedData<Event[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch from API
  try {
    // Only include markets parameter if the array is not empty
    const params: Record<string, string> = { dateFormat: "iso" };

    const response = await makeRequest<Event[]>(
      `/sports/${sportKey}/events`,
      params
    );
    await setCachedData(cacheKey, response);
    return response;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

// Function to get odds for a sport (from old client)
export async function getOdds(
  sport: string,
  bookmakers: string[] = [],
  markets: string[] = ["h2h", "spreads", "totals"],
  oddsFormat = "american"
): Promise<GameOdds[]> {
  // Use the user's generateCacheKey function
  const cacheKey = generateCacheKey(["odds", sport, ...bookmakers, ...markets]);

  // Try to get from cache first
  const cachedData = await getCachedData<GameOdds[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch from API
  try {
    const params: Record<string, string> = {
      dateFormat: "iso",
      oddsFormat,
    };

    if (markets.length > 0) {
      params.markets = markets.join(",");
    }

    if (bookmakers.length > 0) {
      params.bookmakers = bookmakers.join(",");
    }

    const response = await makeRequest<GameOdds[]>(
      `/sports/${sport}/odds`,
      params
    );
    await setCachedData(cacheKey, response);
    return response;
  } catch (error) {
    console.error("Error fetching odds:", error);
    throw error;
  }
}

// Function to fetch player props for a specific event with caching
export async function getEventPlayerProps(
  sportKey: string,
  eventId: string,
  selectedBookmakers: string[],
  markets: string[] = ["player_points", "player_rebounds", "player_assists"]
): Promise<GameOdds> {
  const cacheKey = generateCacheKey([
    "event-props",
    eventId,
    ...selectedBookmakers,
    ...markets,
  ]);

  // Try to get from cache first
  const cachedData = await getCachedData<GameOdds>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch from API
  try {
    const response = await makeRequest<GameOdds>(
      `/sports/${sportKey}/events/${eventId}/odds`,
      {
        markets: markets.join(","),
        bookmakers: selectedBookmakers.join(","),
        oddsFormat: "american",
        includeSids: "true",
      }
    );

    // Filter out bookmakers that weren't requested
    const filteredData = {
      ...response,
      bookmakers: response.bookmakers.filter((b) =>
        selectedBookmakers.includes(b.key)
      ),
    };

    // Cache the filtered data
    await setCachedData(cacheKey, filteredData);

    return filteredData;
  } catch (error) {
    console.error("Error fetching event player props:", error);
    throw error;
  }
}

// Function to get player props for multiple events (from old client)
export async function getPlayerPropsForMultipleEvents(
  sportKey: string,
  eventIds: string[],
  selectedBookmakers: string[],
  markets: string[] = ["player_points", "player_rebounds", "player_assists"],
  delayMs = 1000
): Promise<GameOdds[]> {
  const results: GameOdds[] = [];

  for (let i = 0; i < eventIds.length; i++) {
    const eventId = eventIds[i];

    try {
      // Add delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const response = await getEventPlayerProps(
        sportKey,
        eventId,
        selectedBookmakers,
        markets
      );

      results.push(response);
    } catch (error) {
      console.error(`Error fetching props for event ${eventId}:`, error);
    }
  }

  return results;
}

// Function to get available sports
export async function getAvailableSports(): Promise<Sport[]> {
  const cacheKey = "available-sports";

  const cachedData = await getCachedData<Sport[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await makeRequest<Sport[]>("/sports");
  await setCachedData(cacheKey, response);

  return response;
}

// Function to format odds
export function formatAmericanOdds(odds: number): string {
  if (odds >= 0) {
    return `+${odds}`;
  }
  return odds.toString();
}

// Function to find best odds
export function findBestOdds(
  prop: PlayerProp,
  marketKey: string,
  outcomeType: "Over" | "Under"
): { bookmaker: string; odds: number; line: number } | null {
  let bestOdds = null;
  let bestBookmaker = null;
  let bestLine = null;

  for (const bookmaker of prop.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === marketKey);
    if (!market) continue;

    const outcome = market.outcomes.find((o) => o.name === outcomeType);
    if (!outcome) continue;

    if (bestOdds === null || outcome.price > bestOdds) {
      bestOdds = outcome.price;
      bestBookmaker = bookmaker.key;
      bestLine = outcome.point;
    }
  }

  return bestOdds !== null
    ? { bookmaker: bestBookmaker!, odds: bestOdds, line: bestLine! }
    : null;
}
