#!/usr/bin/env node

const https = require('https');
const axios = require('axios');

// Constants
const NBA_API_URL = 'https://stats.nba.com/stats/leaguegamelog';
const TIMEOUT_MS = 30000; // 30 second timeout

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Format date to YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get date from a week ago
function getLastWeekDate() {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  return lastWeek;
}

// Helper function to make a GET request with custom headers
function makeRequest(url, params, headers) {
  return new Promise((resolve, reject) => {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    const fullUrl = `${url}?${queryString}`;
    console.log(`Making request to: ${fullUrl}`);
    
    const req = https.get(fullUrl, { headers }, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            return reject(new Error(`HTTP Error: ${res.statusCode} ${data}`));
          }
          
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          console.log('Failed to parse JSON response:');
          console.log(data.substring(0, 500) + '...'); // Show first 500 chars
          reject(e);
        }
      });
    });
    
    // Set timeout
    req.setTimeout(TIMEOUT_MS, () => {
      req.abort();
      reject(new Error(`Request timed out after ${TIMEOUT_MS}ms`));
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// Test NBA Stats API
async function testNbaApi() {
  try {
    console.log('Testing NBA Stats API...');
    
    const today = new Date();
    const lastWeek = getLastWeekDate();
    
    const params = new URLSearchParams({
      LeagueID: '00',
      Season: '2024-25',
      SeasonType: 'Playoffs',
      DateFrom: formatDate(lastWeek),
      DateTo: formatDate(today)
    });
    
    const url = `https://stats.nba.com/stats/leaguegamelog?${params.toString()}`;
    
    console.log(`Request URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.nba.com/',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 30000
    });
    
    const data = response.data;
    
    // Extract game logs if available
    let gameLogs = [];
    if (data && data.resultSets && data.resultSets[0] && data.resultSets[0].rowSet) {
      gameLogs = data.resultSets[0].rowSet;
    }
    
    console.log(`Found ${gameLogs.length} game logs`);
    
    // Display a few sample game logs if available
    if (gameLogs.length > 0) {
      console.log('\nSample game logs:');
      for (let i = 0; i < Math.min(3, gameLogs.length); i++) {
        const log = gameLogs[i];
        console.log(`Player: ${log[5]}, Team: ${log[3]}, Points: ${log[24]}, Game Date: ${log[7]}`);
      }
    }
    
    return gameLogs.length;
  } catch (error) {
    console.error(`Error fetching NBA Stats API: ${error.message}`);
    return 0;
  }
}

// Test local API endpoints
async function testLocalEndpoints() {
  try {
    console.log('\nTesting local API endpoints...');
    
    // Test /api/kotp/allPlayers
    console.log('\nTesting /api/kotp/allPlayers endpoint...');
    const allPlayersResponse = await axios.get('http://localhost:3000/api/kotp/allPlayers', { timeout: 10000 });
    console.log(`Status: ${allPlayersResponse.status}`);
    
    if (allPlayersResponse.data && allPlayersResponse.data.games) {
      console.log(`Games found: ${allPlayersResponse.data.games.length}`);
      console.log(`Players found: ${allPlayersResponse.data.players ? allPlayersResponse.data.players.length : 0}`);
    } else {
      console.log('No data found in the response');
    }
    
    // Test /api/kotp/leaderboard
    console.log('\nTesting /api/kotp/leaderboard endpoint...');
    const leaderboardResponse = await axios.get('http://localhost:3000/api/kotp/leaderboard', { timeout: 10000 });
    console.log(`Status: ${leaderboardResponse.status}`);
    
    if (leaderboardResponse.data && leaderboardResponse.data.players) {
      console.log(`Players in leaderboard: ${leaderboardResponse.data.players.length}`);
      console.log(`Playoff round: ${leaderboardResponse.data.playoffRound}`);
      console.log(`Last updated: ${leaderboardResponse.data.lastUpdated}`);
    } else {
      console.log('No leaderboard data found in the response');
    }
    
    return true;
  } catch (error) {
    console.error(`Error testing local endpoints: ${error.message}`);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data:`, error.response.data);
    }
    return false;
  }
}

// Main function
async function main() {
  console.log('=== NBA API and Endpoint Testing ===');
  console.log(`Date: ${new Date().toLocaleString()}`);
  
  const nbaApiGameLogs = await testNbaApi();
  const localEndpointsSuccess = await testLocalEndpoints();
  
  console.log('\n=== Test Summary ===');
  console.log(`NBA Stats API: ${nbaApiGameLogs > 0 ? 'SUCCESS' : 'FAILED'} (${nbaApiGameLogs} game logs found)`);
  console.log(`Local endpoints: ${localEndpointsSuccess ? 'SUCCESS' : 'FAILED'}`);
}

// Run the main function
main().catch(console.error); 