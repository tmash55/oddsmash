#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

/**
 * Local development script to test the update-cache endpoint
 * Run this with: node scripts/local-test-cache.js
 */

const callUpdateCache = async () => {
  try {
    // Get the CRON_SECRET from environment
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.error("Error: CRON_SECRET not found in .env.local file");
      process.exit(1);
    }
    
    console.log("🔄 Calling local update cache endpoint...");
    const response = await fetch(
      `http://localhost:3000/api/kotp/cron/update-cache?secret=${secret}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log("✅ Cache update successful!");
    console.log(data);
  } catch (error) {
    console.error("❌ Error calling update cache endpoint:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.log("Make sure your local development server is running (npm run dev)");
    }
  }
};

callUpdateCache(); 