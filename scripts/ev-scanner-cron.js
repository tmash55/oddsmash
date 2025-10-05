#!/usr/bin/env node

// EV Scanner cron job script
// This script runs the EV scanner on a schedule to refresh cached data

const https = require('https');
const { CRON_SECRET } = process.env;

// List of sports to scan
const SPORTS = [
  'basketball_nba',
  'basketball_ncaab', 
  'american_football_nfl',
  'baseball_mlb'
];

async function runScan(sport) {
  return new Promise((resolve, reject) => {
    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/cron/ev-scanner?sport=${sport}`;
    
    console.log(`Running EV scanner for ${sport}...`);
    
    const options = {
      headers: {
        'x-cron-secret': CRON_SECRET
      }
    };
    
    const req = https.get(apiUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            console.log(`✅ ${sport} scan complete - Found ${response.opportunitiesFound} opportunities`);
            resolve(response);
          } catch (e) {
            console.error(`Error parsing response for ${sport}:`, e);
            reject(e);
          }
        } else {
          console.error(`Error scanning ${sport}: Status ${res.statusCode}`);
          reject(new Error(`HTTP Error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error scanning ${sport}:`, error);
      reject(error);
    });
    
    req.end();
  });
}

async function main() {
  console.log('Starting EV scanner cron job...');
  console.log(`Current time: ${new Date().toISOString()}`);
  
  if (!CRON_SECRET) {
    console.error('Error: CRON_SECRET environment variable is not set');
    process.exit(1);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Run scans sequentially to avoid rate limiting
  for (const sport of SPORTS) {
    try {
      await runScan(sport);
      successCount++;
    } catch (error) {
      console.error(`Failed to scan ${sport}:`, error);
      errorCount++;
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\nEV Scanner Cron Summary:');
  console.log(`✅ Successful scans: ${successCount}`);
  console.log(`❌ Failed scans: ${errorCount}`);
  console.log(`Completed at: ${new Date().toISOString()}`);
}

main().catch(error => {
  console.error('Unhandled error in main process:', error);
  process.exit(1);
}); 