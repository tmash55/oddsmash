#!/usr/bin/env node

// This script triggers the KOTP cache update endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";
const PRODUCTION_URL = process.env.PRODUCTION_URL || "https://oddsmash.vercel.app";
const USE_LOCAL = process.env.USE_LOCAL === "true" || true; // Default to local for development
const LOCAL_URL = "http://localhost:3000";
const BASE_URL = USE_LOCAL ? LOCAL_URL : PRODUCTION_URL;
const API_URL = process.env.API_URL || `${BASE_URL}/api/kotp/kotp-cron`;

// Get current date in YYYY-MM-DD format for cache key generation
const today = new Date().toISOString().split('T')[0];
const CACHE_KEY = `kotp_playoff_${today}`;

async function triggerCacheUpdate() {
  console.log(`Attempting to update KOTP playoff cache with key: ${CACHE_KEY}...`);
  console.log(`Using ${USE_LOCAL ? 'local development' : 'production'} server: ${BASE_URL}`);
  
  if (!CRON_SECRET) {
    console.error("Error: CRON_SECRET environment variable not set");
    console.log("Usage: CRON_SECRET=your_secret node scripts/update-kotp-cache.js");
    process.exit(1);
  }
  
  try {
    const url = `${API_URL}?secret=${encodeURIComponent(CRON_SECRET)}&cache_key=${encodeURIComponent(CACHE_KEY)}`;
    console.log(`Making request to: ${API_URL} (with secret and cache key)`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "OddsMash-CacheUpdater/1.0",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update cache: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Cache update response:", data);
    
    if (data.success) {
      console.log(`Successfully updated playoff cache with ${data.gamelogs || 0} game logs`);
      
      // Check if leaderboard was generated
      if (data.players) {
        console.log(`Leaderboard was also updated with ${data.players} players`);
      }
    } else {
      console.log("Cache update was not successful");
      if (data.message) {
        console.log("Message:", data.message);
      }
    }
  } catch (error) {
    console.error("Error updating cache:", error);
    process.exit(1);
  }
}

// Run the function
triggerCacheUpdate(); 