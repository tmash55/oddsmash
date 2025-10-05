#!/usr/bin/env node

/**
 * Test script to check for duplicate game IDs between historical and live data
 * Run with: node scripts/test-gameids.js
 */

const https = require('https');

// Helper function to make a GET request with promise
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
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
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// Main function
async function main() {
  console.log('Testing for duplicate game IDs...');
  
  try {
    // 1. Fetch the NBA API data directly to see game IDs
    console.log('\nFetching NBA API data...');
    
    // Get today's date in NBA API format (YYYY-MM-DD)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log(`Today's date: ${todayString}`);
    
    // Make the NBA API request
    const nbaApiUrl = 'https://stats.nba.com/stats/leaguegamelog';
    const params = new URLSearchParams({
      Counter: 0,
      DateFrom: '',
      DateTo: '',
      Direction: 'DESC',
      LeagueID: '00',
      PlayerOrTeam: 'P',
      Season: '2024-25',
      SeasonType: 'Playoffs',
      Sorter: 'DATE'
    }).toString();
    
    const apiHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Referer': 'https://www.nba.com',
      'Origin': 'https://www.nba.com'
    };
    
    const nbaApiResponse = await makeRequest(`${nbaApiUrl}?${params}`);
    
    // Extract game logs from the response
    const responseHeaders = nbaApiResponse.resultSets[0].headers;
    const rows = nbaApiResponse.resultSets[0].rowSet;
    
    // Find indices for the columns we need
    const gameIdIndex = responseHeaders.indexOf("GAME_ID");
    const playerNameIndex = responseHeaders.indexOf("PLAYER_NAME");
    const gameDateIndex = responseHeaders.indexOf("GAME_DATE");
    const pointsIndex = responseHeaders.indexOf("PTS");
    
    // Group games by date and count unique game IDs
    const gamesByDate = {};
    rows.forEach(row => {
      const gameId = row[gameIdIndex];
      const gameDate = row[gameDateIndex];
      const playerName = row[playerNameIndex];
      const points = row[pointsIndex];
      
      if (!gamesByDate[gameDate]) {
        gamesByDate[gameDate] = new Set();
      }
      gamesByDate[gameDate].add(gameId);
      
      // Print today's game logs
      if (gameDate === todayString) {
        console.log(`- ${playerName}: ${points} pts in game ${gameId}`);
      }
    });
    
    console.log('\nGames by date:');
    Object.entries(gamesByDate).forEach(([date, gameIds]) => {
      console.log(`${date}: ${gameIds.size} games`);
      if (date === todayString) {
        console.log(`  Today's game IDs: ${[...gameIds].join(', ')}`);
      }
    });
    
    // 2. Test the hybrid endpoint to see if it's properly handling duplicate game IDs
    console.log('\nTesting hybrid endpoint...');
    const hybridResponse = await makeRequest('http://localhost:3000/api/kotp/hybrid');
    
    console.log('Hybrid response summary:');
    console.log(`- Total players: ${hybridResponse.players.length}`);
    console.log(`- Games scheduled today: ${hybridResponse.gamesScheduled ? 'Yes' : 'No'}`);
    console.log(`- All games final: ${hybridResponse.allGamesFinal ? 'Yes' : 'No'}`);
    console.log(`- Live games: ${hybridResponse.hasLiveGames ? 'Yes' : 'No'}`);
    console.log(`- Today's completed games in historical data: ${hybridResponse.cacheInfo?.todayHistoricalGames || 'N/A'}`);
    
    // Show sample players
    console.log('\nSample player point breakdowns:');
    hybridResponse.players.slice(0, 5).forEach((player, i) => {
      console.log(`${i+1}. ${player.name} (${player.teamTricode}): ${player.totalPts} pts`);
      console.log(`   Historical: ${player.points} pts`);
      console.log(`   Live: ${player.livePts} pts`);
      console.log(`   Played today: ${player.playedToday ? 'Yes' : 'No'}`);
      console.log(`   Game status: ${player.gameStatus || 'N/A'}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the main function
main().catch(console.error); 