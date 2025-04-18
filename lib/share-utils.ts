import { createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { redis } from './redis';

// Define the structure of a shareable prop payload
export interface ShareablePropPayload {
  player: string;
  line: number;
  statType: string;
  marketKey: string;
  bookmakers: any[];
  timestamp: number;
  sportId: string;
  // Add fields for game information
  homeTeam?: string;
  awayTeam?: string;
  commence_time?: string;
  // Add event ID for refreshing
  eventId?: string;
  // Add field for event object that might contain team and time info
  event?: {
    homeTeam?: { name: string };
    awayTeam?: { name: string };
    commence_time?: string;
  };
  // Add fields for direct linking
  sids?: Record<string, string>; // Map of bookmaker key to SID
  links?: Record<string, string>; // Map of bookmaker key to deep link
  // Add bet type to track if we're sharing over, under or both
  betType?: "over" | "under" | "both";
  // Add selected bookmakers for refresh consistency
  selectedBooks?: string[];
}

/**
 * Generate a unique share ID
 * @returns A unique short ID for the shared prop
 */
export function generateShareId(): string {
  // Generate a short, URL-friendly unique ID (12 chars by default)
  // This will create IDs like "V1StGXR8_Z5jdHi"
  return nanoid(10);
}

/**
 * Store a shared prop in Redis
 * @param payload The prop data to store
 * @returns The unique ID for the shared prop
 */
export async function storeSharedProp(payload: ShareablePropPayload): Promise<string> {
  try {
    // Generate a unique ID
    const id = generateShareId();
    
    // Add timestamp if not present
    if (!payload.timestamp) {
      payload.timestamp = Date.now();
    }
    
    // Ensure the data is valid before storing
    const validatedPayload = {
      player: payload.player,
      line: payload.line,
      statType: payload.statType,
      marketKey: payload.marketKey,
      bookmakers: payload.bookmakers,
      timestamp: payload.timestamp,
      sportId: payload.sportId || 'default',
      // Include event ID for refreshing
      eventId: payload.eventId,
      // Include game information if available
      homeTeam: payload.homeTeam,
      awayTeam: payload.awayTeam,
      commence_time: payload.commence_time,
      event: payload.event,
      // Include deep linking data
      sids: payload.sids,
      links: payload.links,
      // Include bet type for consistent sharing
      betType: payload.betType || 'both',
      // Include selected bookmakers for refresh consistency
      selectedBooks: payload.selectedBooks || []
    };
    
    // Store in Redis with a TTL of 30 days (in seconds)
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
    const redisKey = `share:${id}`;
    
    // Stringify the data before storing to ensure consistency
    const dataToStore = JSON.stringify(validatedPayload);
    
    await redis.set(redisKey, dataToStore, { ex: THIRTY_DAYS_IN_SECONDS });
    
    return id;
  } catch (error) {
    console.error('Error storing shared prop:', error);
    throw error;
  }
}

/**
 * Retrieve a shared prop from Redis
 * @param id The unique ID for the shared prop
 * @returns The stored prop data, or null if not found
 */
export async function getSharedProp(id: string): Promise<ShareablePropPayload | null> {
  try {
    const redisKey = `share:${id}`;
    const data = await redis.get(redisKey);
    
    if (!data) {
      return null;
    }
    
    // Handle case where data is already an object
    if (typeof data === 'object' && data !== null) {
      return data as ShareablePropPayload;
    }
    
    // Handle string data by parsing it
    try {
      return JSON.parse(data as string) as ShareablePropPayload;
    } catch (parseError) {
      console.error(`Error parsing share data for ID ${id}:`, parseError);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving share with ID ${id}:`, error);
    return null;
  }
}

/**
 * Check if a shared prop is stale (over 1 day old)
 * @param payload The prop data to check
 * @returns Whether the prop data is stale
 */
export function isSharedPropStale(payload: ShareablePropPayload): boolean {
  if (!payload.timestamp) return true;
  
  const now = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  return now - payload.timestamp > oneDayInMs;
} 