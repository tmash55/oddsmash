#!/usr/bin/env node

/**
 * Test script to verify the hybrid endpoint after fixing the double-counting issue
 * Run with: node scripts/test-hybrid-after-fix.js
 */

const https = require('https');

// Make a GET request with promise
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
  console.log('Testing hybrid endpoint after fix...');
  
  try {
    // Test the hybrid endpoint
    const response = await makeRequest('http://localhost:3000/api/kotp/hybrid');
    
    console.log('Response summary:');
    console.log('-----------------------------------------');
    console.log(`Last Updated: ${response.lastUpdated}`);
    console.log(`Playoff Round: ${response.playoffRound}`);
    console.log(`Total Players: ${response.players?.length || 0}`);
    console.log(`Games Scheduled: ${response.gamesScheduled ? 'Yes' : 'No'}`);
    console.log(`All Games Final: ${response.allGamesFinal ? 'Yes' : 'No'}`);
    console.log(`Has Cached Data: ${response.hasCachedData ? 'Yes' : 'No'}`);
    console.log(`Cached Game Logs Count: ${response.cachedGameLogsCount || 0}`);
    console.log('-----------------------------------------');
    
    // Show top 5 players if any
    if (response.players && response.players.length > 0) {
      console.log('\nTop 5 players:');
      response.players.slice(0, 5).forEach((player, index) => {
        console.log(`${index + 1}. ${player.name} (${player.teamTricode}): ${player.totalPts} pts (${player.points} historical + ${player.livePts} live)`);
        
        // Verify no double counting
        if (player.playedToday) {
          console.log(`   Played today: ${player.playedToday ? 'Yes' : 'No'}`);
          console.log(`   Game status: ${player.gameStatus || 'N/A'}`);
          console.log(`   Series record: ${player.seriesRecord.wins}-${player.seriesRecord.losses}`);
        }
      });
    } else {
      console.log('\nNo players found in the response');
    }
    
    // Show any errors
    if (response.error) {
      console.log('\nError encountered:');
      console.log(response.error);
      if (response.errorMessage) {
        console.log(response.errorMessage);
      }
    }
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

// Run the main function
main().catch(console.error); 