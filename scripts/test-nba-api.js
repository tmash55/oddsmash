#!/usr/bin/env node

const https = require('https');

// Constants
const NBA_API_URL = 'https://stats.nba.com/stats/leaguegamelog';
const TIMEOUT_MS = 30000; // 30 second timeout

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD
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

// Main function
async function main() {
  console.log('Testing NBA Stats API...');
  
  // Get today's date
  const todayDate = getTodayDateString();
  console.log(`Using today's date: ${todayDate}`);
  
  const params = {
    LeagueID: '00', // NBA
    Season: '2024-25',
    SeasonType: 'Playoffs',
    Direction: 'DESC',
    DateFrom: todayDate,
    DateTo: todayDate,
    PlayerOrTeam: 'P',
    Counter: 0,
    Sorter: 'DATE',
    SortDirection: 'DESC'
  };
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'Referer': 'https://www.nba.com',
    'Origin': 'https://www.nba.com'
  };
  
  try {
    console.time('API Request');
    const response = await makeRequest(NBA_API_URL, params, headers);
    console.timeEnd('API Request');
    
    if (response.resultSets && response.resultSets[0] && response.resultSets[0].rowSet) {
      const gameLogs = response.resultSets[0].rowSet;
      console.log(`Successfully retrieved ${gameLogs.length} game logs`);
      
      if (gameLogs.length > 0) {
        console.log('\nSample game log entries:');
        gameLogs.slice(0, 3).forEach((log, index) => {
          // Extract relevant columns based on the headers
          const headers = response.resultSets[0].headers;
          const playerNameIndex = headers.indexOf('PLAYER_NAME');
          const teamAbbrevIndex = headers.indexOf('TEAM_ABBREVIATION');
          const pointsIndex = headers.indexOf('PTS');
          const gameDateIndex = headers.indexOf('GAME_DATE');
          const matchupIndex = headers.indexOf('MATCHUP');
          
          console.log(`${index + 1}. ${log[playerNameIndex]} (${log[teamAbbrevIndex]}) - ${log[pointsIndex]} pts - ${log[gameDateIndex]} - ${log[matchupIndex]}`);
        });
      } else {
        console.log('No game logs found for today.');
      }
    } else {
      console.log('Invalid or empty response format. Full response:');
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.error('Error testing NBA Stats API:', error.message);
  }
}

// Run the main function
main().catch(console.error); 