#!/usr/bin/env node

/**
 * Debug script to examine the API response for players with active games
 * Run with: node scripts/debug-live-points.js
 */

const http = require('http');

// Helper function to make a GET request with promise
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
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
  console.log('Debugging live points issue...\n');
  
  try {
    // Fetch data from hybrid API
    console.log('Fetching data from the hybrid API endpoint...');
    const hybridResponse = await makeRequest('http://localhost:3000/api/kotp/hybrid');
    
    // Extract players with live games
    const livePlayers = hybridResponse.players.filter(player => 
      player.playedToday && player.isPlaying && 
      player.gameStatus !== "Completed" && player.gameStatus !== "Final"
    );
    
    // Find Sengun or any players with abnormal live points
    const sengun = hybridResponse.players.find(p => 
      p.name.toLowerCase().includes("sengun")
    );
    
    console.log('\nPlayers with active games:');
    console.log('-----------------------------------------');
    livePlayers.forEach((player, i) => {
      console.log(`${i+1}. ${player.name} (${player.teamTricode})`);
      console.log(`   Historical: ${player.points} pts`);
      console.log(`   Live: ${player.livePts} pts`);
      console.log(`   PPG: ${player.ppg}`);
      console.log(`   Total: ${player.totalPts} pts`);
      console.log(`   Game Status: ${player.gameStatus}`);
      console.log(`   Playing Today: ${player.playedToday}`);
      console.log(`   Is Playing: ${player.isPlaying}`);
      
      // Check if live points are close to PPG
      if (Math.abs(player.livePts - player.ppg) < 3) {
        console.log(`   ⚠️ MATCH: Live points (${player.livePts}) very close to PPG (${player.ppg})`);
      }
      
      console.log('');
    });
    
    // Specifically examine Sengun if found
    if (sengun) {
      console.log('\nSengun Details:');
      console.log('-----------------------------------------');
      console.log(`Name: ${sengun.name}`);
      console.log(`Team: ${sengun.teamTricode}`);
      console.log(`Historical Points: ${sengun.points}`);
      console.log(`Live Points: ${sengun.livePts}`);
      console.log(`PPG: ${sengun.ppg}`);
      console.log(`Games Played: ${sengun.gamesPlayed}`);
      console.log(`Total Points: ${sengun.totalPts}`);
      console.log(`Series Record: ${sengun.seriesRecord.wins}-${sengun.seriesRecord.losses}`);
      console.log(`Game Status: ${sengun.gameStatus}`);
      console.log(`Is Playing: ${sengun.isPlaying}`);
      console.log(`Played Today: ${sengun.playedToday}`);
      
      // Check if live points match PPG
      if (Math.abs(sengun.livePts - sengun.ppg) < 3) {
        console.log(`⚠️ POTENTIAL ISSUE: Live points (${sengun.livePts}) very close to PPG (${sengun.ppg})`);
        console.log(`This suggests the API might be incorrectly using PPG instead of actual game points`);
      }
      
      // Verify the math adds up
      console.log(`\nPoints math check:`);
      console.log(`Historical (${sengun.points}) + Live (${sengun.livePts}) = ${sengun.points + sengun.livePts}`);
      console.log(`Reported total: ${sengun.totalPts}`);
      if (sengun.totalPts !== sengun.points + sengun.livePts) {
        console.log(`⚠️ MISMATCH: Calculated total (${sengun.points + sengun.livePts}) doesn't match reported total (${sengun.totalPts})`);
      }
      
      // Check if Sengun has played in multiple games that might be in the API
      console.log('\nChecking if Sengun appears in multiple games...');
      const allPlayersNamed = hybridResponse.players.filter(p => 
        p.name.toLowerCase().includes("sengun")
      );
      
      if (allPlayersNamed.length > 1) {
        console.log(`Found ${allPlayersNamed.length} entries for Sengun!`);
        allPlayersNamed.forEach((p, i) => {
          console.log(`Entry ${i+1}:`);
          console.log(`  ID: ${p.personId}`);
          console.log(`  Historical: ${p.points} pts`);
          console.log(`  Live: ${p.livePts} pts`);
          console.log(`  Game Status: ${p.gameStatus}`);
        });
      } else {
        console.log('Only one entry found for Sengun.');
      }
    } else {
      console.log('\nSengun not found in the players list.');
    }
    
    // Check for any players with suspicious live point totals
    const suspiciousPlayers = hybridResponse.players.filter(p => 
      p.livePts > 40 && p.isPlaying && p.playedToday
    );
    
    if (suspiciousPlayers.length > 0) {
      console.log('\nPlayers with suspiciously high live points:');
      console.log('-----------------------------------------');
      suspiciousPlayers.forEach((player, i) => {
        console.log(`${i+1}. ${player.name} (${player.teamTricode}): ${player.livePts} live pts`);
        console.log(`   Game Status: ${player.gameStatus}`);
      });
    }
    
    // Check the games that are currently active
    if (hybridResponse.games && Array.isArray(hybridResponse.games)) {
      console.log('\nActive Games:');
      console.log('-----------------------------------------');
      hybridResponse.games.forEach((game, i) => {
        console.log(`Game ${i+1}: ${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode}`);
        console.log(`  Status: ${game.gameStatus}`);
        console.log(`  Score: ${game.awayTeam.score} - ${game.homeTeam.score}`);
        console.log(`  Game ID: ${game.gameId}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the main function
main().catch(console.error); 