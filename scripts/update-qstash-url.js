#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const { Client } = require("@upstash/qstash");

// Check if token is provided
if (!process.env.QSTASH_TOKEN) {
  console.error("Error: QSTASH_TOKEN environment variable is required");
  console.log("Please add it to your .env.local file");
  process.exit(1);
}

// Check if CRON_SECRET is provided
if (!process.env.CRON_SECRET) {
  console.error("Error: CRON_SECRET environment variable is required");
  console.log("Please add it to your .env.local file");
  process.exit(1);
}

// Schedule ID to update (from the previous creation)
const SCHEDULE_ID = "scd_6qdEW7XQyeS9kkY77kdEwy4GUFGr";

async function updateSchedule() {
  try {
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    
    // Get the domain from command line args or use default
    const domain = process.argv[2] || "https://oddsmash.io";
    
    // Construct the correct URL path - using the correct Next.js API path format
    const destination = `${domain}/api/kotp/cron/update-cache?secret=${process.env.CRON_SECRET}`;
    
    console.log(`Updating schedule endpoint to: ${destination}`);
    
    // Delete the existing schedule
    console.log(`Deleting existing schedule: ${SCHEDULE_ID}`);
    await client.schedules.delete(SCHEDULE_ID);
    
    // Create a new schedule with the updated URL
    console.log("Creating new schedule with updated URL...");
    const result = await client.schedules.create({
      destination,
      cron: "*/5 * * * *",
    });
    
    console.log("✅ Schedule updated successfully!");
    console.log("New Schedule ID:", result.scheduleId);
    console.log("You can verify in the Upstash Console");
  } catch (error) {
    console.error("❌ Failed to update schedule:", error.message);
    console.error("You may need to update the schedule manually in the Upstash Console");
    console.log("Go to https://console.upstash.com/qstash and update the URL to:");
    console.log(`${process.argv[2] || "https://oddsmash.io"}/api/kotp/cron/update-cache?secret=${process.env.CRON_SECRET}`);
  }
}

updateSchedule(); 