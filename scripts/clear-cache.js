#!/usr/bin/env node

const { Redis } = require('@upstash/redis');

// Initialize Redis client from environment variables
const redis = Redis.fromEnv();

// Cache keys to clear
const cacheKeys = [
  'kotp_gamelog_cache',
  'kotp_leaderboard_cache',
  'kotp_scoreboard_cache'
];

async function clearCache() {
  console.log('Clearing KOTP Redis cache...');
  
  try {
    for (const key of cacheKeys) {
      const result = await redis.del(key);
      console.log(`Deleted key: ${key} - Result: ${result ? 'Success' : 'Key not found'}`);
    }
    
    console.log('Cache clearing completed.');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

clearCache().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 