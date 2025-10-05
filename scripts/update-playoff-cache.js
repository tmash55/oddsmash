#!/usr/bin/env node

// This script triggers the KOTP cache update endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";
const PRODUCTION_URL = process.env.PRODUCTION_URL || "https://oddsmash.vercel.app";
const API_URL = process.env.API_URL || PRODUCTION_URL + "/api/kotp/cron/update-cache";

async function triggerCacheUpdate() {
  console.log("Attempting to update KOTP playoff cache...");
  
  if (!CRON_SECRET) {
    console.error("Error: CRON_SECRET environment variable not set");
    console.log("Usage: CRON_SECRET=your_secret node scripts/update-playoff-cache.js");
    process.exit(1);
  }
  
  try {
    const url = `${API_URL}?secret=${encodeURIComponent(CRON_SECRET)}`;
    console.log(`Making request to: ${API_URL} (with secret)`);
    
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
      console.log(`Successfully updated playoff cache with ${data.count} game logs`);
      
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