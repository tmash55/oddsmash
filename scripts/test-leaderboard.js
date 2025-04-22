#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testLeaderboardEndpoint() {
  try {
    console.log('=== Testing KOTP Leaderboard Endpoint ===');
    console.log(`Date: ${new Date().toLocaleString()}`);
    console.log('');
    
    // Check if Supabase credentials are available
    console.log('Checking environment variables:');
    console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? 'Available ✅' : 'Missing ❌'}`);
    console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_KEY ? 'Available ✅' : 'Missing ❌'}`);
    console.log('');
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing required environment variables. Please check your .env.local file.');
      return;
    }
    
    console.log('Testing /api/kotp/leaderboard endpoint...');
    const url = 'http://localhost:3000/api/kotp/leaderboard';
    console.log(`Request URL: ${url}`);
    
    const start = Date.now();
    const response = await axios.get(url, { timeout: 10000 });
    const duration = Date.now() - start;
    
    console.log(`Response time: ${duration}ms`);
    console.log(`Status: ${response.status}`);
    
    if (response.data && response.data.players) {
      console.log(`Players in leaderboard: ${response.data.players.length}`);
      console.log(`Playoff round: ${response.data.playoffRound}`);
      console.log(`Last updated: ${response.data.lastUpdated}`);
      console.log(`Data source: ${response.data.dataSource || 'unknown'}`);
      console.log(`Games scheduled today: ${response.data.gamesScheduled ? 'Yes' : 'No'}`);
      
      // Display the top 5 players
      if (response.data.players.length > 0) {
        console.log('\nTop 5 players:');
        for (let i = 0; i < Math.min(5, response.data.players.length); i++) {
          const player = response.data.players[i];
          const todayPoints = player.todayPts > 0 ? `, Today: ${player.todayPts}` : '';
          console.log(`${i+1}. ${player.name} (${player.teamTricode}) - ${player.points} pts${todayPoints}, ${player.gamesPlayed} games played, Series: ${player.seriesRecord.wins}-${player.seriesRecord.losses}`);
        }
      }
      
      // Count players with points today
      const playersWithPointsToday = response.data.players.filter(p => p.todayPts > 0).length;
      if (playersWithPointsToday > 0) {
        console.log(`\nPlayers with points today: ${playersWithPointsToday}`);
        console.log('\nTop 5 players by today\'s points:');
        const topTodayPlayers = [...response.data.players]
          .filter(p => p.todayPts > 0)
          .sort((a, b) => b.todayPts - a.todayPts)
          .slice(0, 5);
          
        for (let i = 0; i < topTodayPlayers.length; i++) {
          const player = topTodayPlayers[i];
          console.log(`${i+1}. ${player.name} (${player.teamTricode}) - Today: ${player.todayPts}, Total: ${player.points} pts`);
        }
      } else {
        console.log('\nNo players with points today');
      }
    } else {
      console.log('No leaderboard data found in the response');
      console.log('Response data:', response.data);
    }
    
    return true;
  } catch (error) {
    console.error(`Error testing leaderboard endpoint: ${error.message}`);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

// Execute the test
testLeaderboardEndpoint().catch(console.error); 