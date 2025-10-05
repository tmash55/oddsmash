#!/usr/bin/env node

const http = require('http');

// Helper function to make a GET request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) {
        console.log(`Redirect to ${res.headers.location}`);
        return resolve(makeRequest(res.headers.location));
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          console.log('Failed to parse JSON response:');
          console.log(data);
          resolve({ error: 'Failed to parse response', rawResponse: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Main function
async function main() {
  console.log('Testing hybrid endpoint...');
  
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