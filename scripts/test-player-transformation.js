#!/usr/bin/env node

/**
 * Test script to verify the client-side transformation logic for fixing double-counting
 * Run with: node scripts/test-player-transformation.js
 */

// Sample player data with different game statuses
const mockPlayers = [
  {
    name: "Player A - Double Counted",
    personId: "1",
    points: 30,  // Historical points
    livePts: 30, // Live points (same game that's now completed)
    totalPts: 60, // Incorrectly summed
    playedToday: true,
    gameStatus: "Completed",
    seriesRecord: {
      wins: 2, // Double-counted: should be 1
      losses: 0
    }
  },
  {
    name: "Player B - Game in Progress",
    personId: "2",
    points: 25,   // Historical points
    livePts: 15,  // Live points from ongoing game
    totalPts: 40, // Correctly summed
    playedToday: true,
    gameStatus: "3Q 5:42",
    seriesRecord: {
      wins: 1,
      losses: 0
    }
  },
  {
    name: "Player C - Not Played Today",
    personId: "3",
    points: 45,   // Historical points only 
    livePts: 0,   // No live points
    totalPts: 45, // Correctly summed
    playedToday: false,
    gameStatus: "",
    seriesRecord: {
      wins: 1,
      losses: 1
    }
  },
  {
    name: "Player D - Final Status",
    personId: "4",
    points: 20,   // Historical points
    livePts: 20,  // Live points (same game that's now Final)
    totalPts: 40, // Incorrectly summed
    playedToday: true,
    gameStatus: "Final",
    seriesRecord: {
      wins: 0,
      losses: 2 // Double-counted: should be 1
    }
  }
];

// Transformation function to fix double-counting (similar to what we added to the React component)
function transformPlayers(players) {
  if (!players || !Array.isArray(players)) return [];
  
  // First pass: fix point totals for each player
  const correctedPlayers = players.map(player => {
    // Create a copy of the player to avoid mutating the original
    const transformedPlayer = { ...player };
    
    // If a player played today AND their game is final, don't double count
    // by adding their livePts to their total points
    if (player.playedToday && (player.gameStatus === "Completed" || player.gameStatus === "Final")) {
      // Only use their historical points for the totalPts value
      transformedPlayer.totalPts = player.points;
      console.log(`Correcting points for ${player.name}: Using ${player.points} instead of ${player.totalPts}`);
      
      // Also fix the series record by dividing wins/losses by 2 if they're double-counted
      // This is a heuristic that assumes the records are exactly doubled
      const wins = player.seriesRecord.wins;
      const losses = player.seriesRecord.losses;
      
      // Check if the wins or losses look doubled (more than zero and even number)
      if (wins > 0 && wins % 2 === 0) {
        transformedPlayer.seriesRecord.wins = wins / 2;
        console.log(`Correcting series wins for ${player.name}: ${wins} → ${wins / 2}`);
      }
      
      if (losses > 0 && losses % 2 === 0) {
        transformedPlayer.seriesRecord.losses = losses / 2;
        console.log(`Correcting series losses for ${player.name}: ${losses} → ${losses / 2}`);
      }
    }
    
    return transformedPlayer;
  });
  
  // Second pass: resort players by the corrected totalPts
  return correctedPlayers.sort((a, b) => b.totalPts - a.totalPts);
}

// Main function
function main() {
  console.log('Testing player transformation logic to fix double-counting...\n');
  
  console.log('Original players data:');
  console.log('-----------------------------------------');
  mockPlayers.forEach((player, i) => {
    console.log(`${i+1}. ${player.name}`);
    console.log(`   Historical: ${player.points} pts`);
    console.log(`   Live: ${player.livePts} pts`);
    console.log(`   Total: ${player.totalPts} pts`);
    console.log(`   Series Record: ${player.seriesRecord.wins}-${player.seriesRecord.losses}`);
    console.log(`   Played Today: ${player.playedToday ? 'Yes' : 'No'}`);
    console.log(`   Game Status: ${player.gameStatus || 'N/A'}`);
    console.log('');
  });
  
  console.log('Transformed players data:');
  console.log('-----------------------------------------');
  const transformedPlayers = transformPlayers(mockPlayers);
  
  transformedPlayers.forEach((player, i) => {
    // Find the original player by personId to accurately compare
    const originalPlayer = mockPlayers.find(p => p.personId === player.personId);
    const isPointsFixed = player.totalPts !== originalPlayer.totalPts;
    const isSeriesFixed = 
      player.seriesRecord.wins !== originalPlayer.seriesRecord.wins || 
      player.seriesRecord.losses !== originalPlayer.seriesRecord.losses;
    const isFixed = isPointsFixed || isSeriesFixed;
    
    console.log(`${i+1}. ${player.name} ${isFixed ? '✅ FIXED' : ''}`);
    console.log(`   Historical: ${player.points} pts`);
    console.log(`   Live: ${player.livePts} pts`);
    console.log(`   Total: ${player.totalPts} pts ${isPointsFixed ? `(Original: ${originalPlayer.totalPts})` : ''}`);
    console.log(`   Series Record: ${player.seriesRecord.wins}-${player.seriesRecord.losses} ${
      isSeriesFixed ? `(Original: ${originalPlayer.seriesRecord.wins}-${originalPlayer.seriesRecord.losses})` : ''
    }`);
    console.log(`   Played Today: ${player.playedToday ? 'Yes' : 'No'}`);
    console.log(`   Game Status: ${player.gameStatus || 'N/A'}`);
    console.log('');
  });
  
  console.log('Summary:');
  console.log('-----------------------------------------');
  const pointsFixedCount = transformedPlayers.filter(p => {
    const original = mockPlayers.find(op => op.personId === p.personId);
    return p.totalPts !== original.totalPts;
  }).length;
  
  const seriesFixedCount = transformedPlayers.filter(p => {
    const original = mockPlayers.find(op => op.personId === p.personId);
    return p.seriesRecord.wins !== original.seriesRecord.wins || 
           p.seriesRecord.losses !== original.seriesRecord.losses;
  }).length;
  
  console.log(`Total players: ${mockPlayers.length}`);
  console.log(`Players with points fixed: ${pointsFixedCount}`);
  console.log(`Players with series record fixed: ${seriesFixedCount}`);
}

// Run the main function
main(); 