#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

// Initialize Redis client with environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache keys from the app constants
const GAMELOG_CACHE_KEY = "kotp_playoff_game_logs";
const LEADERBOARD_CACHE_KEY = "kotp_leaderboard";

async function initializeEmptyCache() {
  try {
    console.log("Initializing empty caches for KOTP...");
    
    // Initialize empty game logs
    const emptyGameLogs = [];
    await redis.set(GAMELOG_CACHE_KEY, emptyGameLogs, { ex: 60 * 60 }); // Cache for 1 hour
    console.log(`✅ Set empty game logs in ${GAMELOG_CACHE_KEY}`);
    
    // Initialize empty leaderboard
    const emptyLeaderboard = {
      players: [],
      allGamesFinal: true,
      playoffRound: "Round 1"
    };
    await redis.set(LEADERBOARD_CACHE_KEY, emptyLeaderboard, { ex: 60 * 60 }); // Cache for 1 hour
    console.log(`✅ Set empty leaderboard in ${LEADERBOARD_CACHE_KEY}`);
    
    console.log("Cache initialization complete.");
    
    // Verify the data was set
    const gameLogsCache = await redis.get(GAMELOG_CACHE_KEY);
    const leaderboardCache = await redis.get(LEADERBOARD_CACHE_KEY);
    
    console.log("Verification:");
    console.log(`Game logs cache exists: ${gameLogsCache !== null}`);
    console.log(`Leaderboard cache exists: ${leaderboardCache !== null}`);
    
  } catch (error) {
    console.error("Error initializing cache:", error);
  }
}

// Run the function
initializeEmptyCache(); 