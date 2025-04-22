#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Get our cron secret from env
require('dotenv').config({ path: '.env.local' });
const CRON_SECRET = process.env.CRON_SECRET || '';

if (!CRON_SECRET) {
  console.error('Error: CRON_SECRET not found in environment variables');
  process.exit(1);
}

// Configuration
const BASE_URL = 'http://localhost:3000';
const ENDPOINTS = [
  {
    name: 'Fetch Game Logs',
    path: `/api/kotp/fetch-game-logs?secret=${CRON_SECRET}`,
    description: 'Fetches NBA playoff game logs and caches them'
  },
  {
    name: 'Fetch Scoreboard',
    path: `/api/kotp/fetch-scoreboard?secret=${CRON_SECRET}`,
    description: 'Fetches the latest NBA scoreboard data for live games'
  },
  {
    name: 'Build Leaderboard',
    path: `/api/kotp/build-leaderboard?secret=${CRON_SECRET}`,
    description: 'Builds the KOTP leaderboard from cached data'
  },
  {
    name: 'Get Leaderboard (Client API)',
    path: '/api/kotp/leaderboard',
    description: 'Gets the cached leaderboard data (client-facing API)'
  }
];

// Helper function to make a request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    console.log(`Making request to: ${url}`);
    const startTime = Date.now();
    
    // Determine if http or https
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`  Duration: ${duration}ms`);
        
        try {
          const jsonData = JSON.parse(data);
          resolve({ 
            statusCode: res.statusCode,
            data: jsonData,
            duration
          });
        } catch (e) {
          console.log('  Failed to parse JSON response');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    // Set a reasonable timeout
    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error(`Request timed out after 30s`));
    });
  });
}

// Main function to test all endpoints
async function testAllEndpoints() {
  console.log('🏀 Testing KOTP API Architecture\n');
  
  for (const endpoint of ENDPOINTS) {
    console.log(`\n⏳ Testing ${endpoint.name}...`);
    console.log(`   ${endpoint.description}`);
    
    try {
      const url = `${BASE_URL}${endpoint.path}`;
      const result = await makeRequest(url);
      
      console.log(`   Results:`);
      console.log(`   - Success: ${result.data.success !== false ? '✅' : '❌'}`);
      
      // Display different information based on the endpoint
      if (endpoint.name.includes('Game Logs')) {
        console.log(`   - Game logs: ${result.data.count || 0}`);
        console.log(`   - From cache: ${result.data.fromCache ? 'Yes' : 'No'}`);
      } else if (endpoint.name.includes('Scoreboard')) {
        console.log(`   - Games today: ${result.data.gamesCount || 0}`);
        console.log(`   - Active games: ${result.data.hasActiveGames ? 'Yes' : 'No'}`);
      } else if (endpoint.name.includes('Build Leaderboard')) {
        console.log(`   - Players: ${result.data.playerCount || 0}`);
        console.log(`   - All games final: ${result.data.allGamesFinal ? 'Yes' : 'No'}`);
      } else if (endpoint.name.includes('Get Leaderboard')) {
        console.log(`   - Players: ${result.data.players?.length || 0}`);
        console.log(`   - From cache: ${result.data.fromCache ? 'Yes' : 'No'}`);
        
        // Show top 3 players if available
        if (result.data.players && result.data.players.length > 0) {
          console.log('\n   🏆 Top Players:');
          result.data.players.slice(0, 3).forEach((player, index) => {
            console.log(`   ${index + 1}. ${player.name} (${player.teamTricode}) - ${player.points} pts`);
          });
        }
      }
      
      console.log(`   ⏱️ Request took: ${result.duration}ms`);
    } catch (error) {
      console.error(`   ❌ Error testing ${endpoint.name}:`, error.message);
    }
  }
  
  console.log('\n✅ API testing complete!');
}

// Run the test
testAllEndpoints().catch(console.error); 