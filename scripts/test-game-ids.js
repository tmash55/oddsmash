#!/usr/bin/env node

console.log('Testing NBA Scoreboard API to check game IDs...');

async function fetchScoreboard() {
  try {
    const res = await fetch(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": "https://www.nba.com/",
          "Accept": "application/json",
          "Origin": "https://www.nba.com",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      }
    );
    
    if (!res.ok) {
      console.error(`API request failed with status: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    return data.scoreboard;
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    return null;
  }
}

async function main() {
  const scoreboard = await fetchScoreboard();
  
  if (!scoreboard || !scoreboard.games || scoreboard.games.length === 0) {
    console.log('No games found in today\'s scoreboard.');
    return;
  }
  
  console.log(`Found ${scoreboard.games.length} games today.`);
  console.log('Game details:');
  console.log('-'.repeat(80));
  
  scoreboard.games.forEach((game, index) => {
    console.log(`Game ${index + 1}:`);
    console.log(`  Game ID: ${game.gameId}`);
    console.log(`  Matchup: ${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode}`);
    console.log(`  Status: ${game.gameStatusText}`);
    console.log(`  Game Label: ${game.gameLabel || 'N/A'}`);
    console.log(`  Is Playoff Game: ${game.gameId.toString().startsWith('004') ? 'YES' : 'NO'}`);
    console.log(`  Is Play-in Game: ${game.gameId.toString().startsWith('003') ? 'YES' : 'NO'}`);
    console.log('-'.repeat(80));
  });
  
  // Count by type
  const playoffGames = scoreboard.games.filter(game => game.gameId.toString().startsWith('004')).length;
  const playinGames = scoreboard.games.filter(game => game.gameId.toString().startsWith('003')).length;
  const otherGames = scoreboard.games.length - playoffGames - playinGames;
  
  console.log('Summary:');
  console.log(`  Playoff Games (004): ${playoffGames}`);
  console.log(`  Play-in Games (003): ${playinGames}`);
  console.log(`  Other Games: ${otherGames}`);
}

main().catch(error => {
  console.error('Unhandled error:', error);
}); 