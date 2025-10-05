#!/usr/bin/env node

/**
 * Test script to compare the fixed leaderboard endpoint with the hybrid endpoint
 * Run with: node scripts/test-leaderboard-fix.js
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
  console.log('Comparing leaderboard endpoints...\n');
  
  try {
    // Fetch data from both endpoints
    console.log('Fetching data from the fixed leaderboard endpoint...');
    const leaderboardResponse = await makeRequest('http://localhost:3000/api/kotp/leaderboard');
    
    console.log('Fetching data from the hybrid endpoint...');
    const hybridResponse = await makeRequest('http://localhost:3000/api/kotp/hybrid');
    
    // Basic response info
    console.log('\nLeaderboard Response Summary:');
    console.log('-----------------------------------------');
    console.log(`Total Players: ${leaderboardResponse.players?.length || 0}`);
    console.log(`All Games Final: ${leaderboardResponse.allGamesFinal ? 'Yes' : 'No'}`);
    console.log(`Last Updated: ${leaderboardResponse.lastUpdated}`);
    console.log(`Playoff Round: ${leaderboardResponse.playoffRound}`);
    
    console.log('\nHybrid Response Summary:');
    console.log('-----------------------------------------');
    console.log(`Total Players: ${hybridResponse.players?.length || 0}`);
    console.log(`All Games Final: ${hybridResponse.allGamesFinal ? 'Yes' : 'No'}`);
    console.log(`Last Updated: ${hybridResponse.lastUpdated}`);
    console.log(`Playoff Round: ${hybridResponse.playoffRound}`);
    console.log(`Today's Historical Games: ${hybridResponse.cacheInfo?.todayHistoricalGames || 'N/A'}`);
    
    // Compare top players
    console.log('\nTop 5 Players Comparison:');
    console.log('-----------------------------------------');
    
    const leaderboardTopPlayers = leaderboardResponse.players?.slice(0, 5) || [];
    const hybridTopPlayers = hybridResponse.players?.slice(0, 5) || [];
    
    console.log('Leaderboard endpoint top players:');
    leaderboardTopPlayers.forEach((player, i) => {
      console.log(`${i+1}. ${player.name} (${player.teamTricode}): ${player.totalPts} pts = ${player.points} historical + ${player.livePts} live`);
    });
    
    console.log('\nHybrid endpoint top players:');
    hybridTopPlayers.forEach((player, i) => {
      console.log(`${i+1}. ${player.name} (${player.teamTricode}): ${player.totalPts} pts = ${player.points} historical + ${player.livePts} live`);
    });
    
    // Check for double-counting issues
    console.log('\nChecking for point calculation consistency...');
    console.log('-----------------------------------------');
    
    const allPlayers = new Map();
    
    // Collect all players from both endpoints
    leaderboardResponse.players?.forEach(player => {
      allPlayers.set(player.personId, {
        name: player.name,
        leaderboard: {
          historical: player.points,
          live: player.livePts,
          total: player.totalPts
        }
      });
    });
    
    hybridResponse.players?.forEach(player => {
      const existingPlayer = allPlayers.get(player.personId);
      if (existingPlayer) {
        existingPlayer.hybrid = {
          historical: player.points,
          live: player.livePts,
          total: player.totalPts
        };
      } else {
        allPlayers.set(player.personId, {
          name: player.name,
          hybrid: {
            historical: player.points,
            live: player.livePts,
            total: player.totalPts
          }
        });
      }
    });
    
    // Check for discrepancies
    let discrepancyCount = 0;
    
    for (const [id, player] of allPlayers.entries()) {
      if (player.leaderboard && player.hybrid) {
        const lbTotal = player.leaderboard.total;
        const hybridTotal = player.hybrid.total;
        
        if (lbTotal !== hybridTotal) {
          discrepancyCount++;
          if (discrepancyCount <= 5) { // Only show the first 5 discrepancies
            console.log(`Discrepancy found for ${player.name}:`);
            console.log(`  Leaderboard: ${lbTotal} pts (${player.leaderboard.historical} + ${player.leaderboard.live})`);
            console.log(`  Hybrid: ${hybridTotal} pts (${player.hybrid.historical} + ${player.hybrid.live})`);
            console.log(`  Difference: ${Math.abs(lbTotal - hybridTotal)} points\n`);
          }
        }
      }
    }
    
    if (discrepancyCount === 0) {
      console.log('✅ No point calculation discrepancies found between endpoints!');
    } else {
      console.log(`⚠️ Found ${discrepancyCount} players with different point totals between endpoints.`);
      if (discrepancyCount > 5) {
        console.log(`   (Only showing the first 5 discrepancies)`);
      }
    }
    
    // Final recommendation
    console.log('\nSUMMARY:');
    console.log('-----------------------------------------');
    if (discrepancyCount === 0) {
      console.log('Both endpoints are providing consistent data.');
      console.log('✅ It is safe to switch the dashboard to use the /api/kotp/leaderboard endpoint.');
    } else {
      console.log('There are some discrepancies between the endpoints.');
      console.log('⚠️ Please review the differences carefully before switching endpoints.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the main function
main().catch(console.error); 