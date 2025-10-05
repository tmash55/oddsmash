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

// Check if URL is provided
const appUrl = process.argv[2];
if (!appUrl) {
  console.error("Error: Please provide your application URL as an argument");
  console.log("Example: node scripts/setup-upstash-schedule.js https://your-app.vercel.app");
  process.exit(1);
}

async function createSchedule() {
  try {
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    
    const destination = `${appUrl}/api/kotp/cron/update-cache?secret=${process.env.CRON_SECRET}`;
    
    console.log(`Creating schedule for endpoint: ${destination}`);
    
    const result = await client.schedules.create({
      destination,
      cron: "*/5 * * * *", // Every 5 minutes
    });
    
    console.log("✅ Schedule created successfully!");
    console.log("Schedule ID:", result.scheduleId);
    console.log("You can manage your schedules in the Upstash Console");
  } catch (error) {
    console.error("❌ Failed to create schedule:", error.message);
    console.error("Please check your QSTASH_TOKEN and try again");
  }
}

createSchedule(); 