import { PlayerHitRateProfile, HitRateFilters, Market } from "@/types/hit-rates";

/**
 * Generate mock hit rate data for testing
 */
export function generateMockHitRateProfiles(): PlayerHitRateProfile[] {
  const players = [
    { id: 1, name: "Aaron Judge", team: "New York Yankees" },
    { id: 2, name: "Shohei Ohtani", team: "Los Angeles Dodgers" },
    { id: 3, name: "Juan Soto", team: "New York Yankees" },
    { id: 4, name: "Mookie Betts", team: "Los Angeles Dodgers" },
    { id: 5, name: "Gerrit Cole", team: "New York Yankees" },
    { id: 6, name: "Rafael Devers", team: "Boston Red Sox" },
    { id: 7, name: "Freddie Freeman", team: "Los Angeles Dodgers" },
    { id: 8, name: "Jackson Chourio", team: "Milwaukee Brewers" },
    { id: 9, name: "Elly De La Cruz", team: "Cincinnati Reds" },
    { id: 10, name: "Marcus Semien", team: "Texas Rangers" },
  ];

  // Create some mock games
  const games = [
    { id: "g1", home: "New York Yankees", away: "Boston Red Sox", time: new Date().toISOString() },
    { id: "g2", home: "Los Angeles Dodgers", away: "San Francisco Giants", time: new Date(Date.now() + 86400000).toISOString() },
    { id: "g3", home: "Milwaukee Brewers", away: "Chicago Cubs", time: new Date(Date.now() + 172800000).toISOString() },
    { id: "g4", home: "Cincinnati Reds", away: "Pittsburgh Pirates", time: new Date(Date.now() + 259200000).toISOString() },
    { id: "g5", home: "Texas Rangers", away: "Houston Astros", time: new Date(Date.now() + 345600000).toISOString() },
  ];

  const markets: Market[] = ["Hits", "Total Bases", "Home Runs", "Strikeouts", "RBIs"];
  const profiles: PlayerHitRateProfile[] = [];

  // Generate hit rate profiles for each player and market
  players.forEach((player, index) => {
    // Assign a game to this player based on their team
    const playerGame = games.find(g => g.home === player.team || g.away === player.team);
    
    markets.forEach((market, marketIndex) => {
      // Skip some combinations to make the data more realistic
      if (Math.random() > 0.7) return;

      const line = getDefaultLine(market);
      
      // Generate random hit rates
      const last5HitRate = Math.floor(Math.random() * 100);
      const last10HitRate = Math.floor(Math.random() * 100);
      const last20HitRate = Math.floor(Math.random() * 100);
      const avgStatPerGame = Math.random() * 3 + 0.5;

      // Generate points histogram
      const pointsHistogram = {
        last_5: generateHistogram(5),
        last_10: generateHistogram(10),
        last_20: generateHistogram(20)
      };

      // Generate line streaks
      const lineStreaks = {
        "0": Math.floor(Math.random() * 5),
        "1": Math.floor(Math.random() * 15),
        "2": Math.floor(Math.random() * 5),
        "3": Math.floor(Math.random() * 3),
        "4": Math.floor(Math.random() * 2),
        "5": Math.floor(Math.random() * 1)
      };

      profiles.push({
        id: index * 100 + marketIndex,
        league_id: 1,
        player_id: player.id,
        player_name: player.name,
        team_name: player.team,
        market: market,
        line: line,
        last_5_hit_rate: last5HitRate,
        last_10_hit_rate: last10HitRate,
        last_20_hit_rate: last20HitRate,
        avg_stat_per_game: avgStatPerGame,
        points_histogram: pointsHistogram,
        line_streaks: lineStreaks,
        updated_at: new Date().toISOString(),
        // Add game information if we found a matching game
        ...(playerGame ? {
          odds_event_id: playerGame.id,
          home_team: playerGame.home,
          away_team: playerGame.away,
          commence_time: playerGame.time
        } : {})
      });
    });
  });

  return profiles;
}

/**
 * Generate a random histogram for points
 */
function generateHistogram(games: number): Record<string, number> {
  const histogram: Record<string, number> = {};
  let remainingGames = games;
  
  // Add some variety to the points (0-4)
  for (let i = 0; i <= 4; i++) {
    if (remainingGames <= 0) break;
    
    const count = i === 0 
      ? Math.floor(Math.random() * remainingGames) 
      : Math.min(Math.floor(Math.random() * (remainingGames / 2) + 1), remainingGames);
    
    if (count > 0) {
      histogram[i.toString()] = count;
      remainingGames -= count;
    }
  }
  
  // If we still have games to allocate, put them in 0
  if (remainingGames > 0) {
    histogram["0"] = (histogram["0"] || 0) + remainingGames;
  }
  
  return histogram;
}

/**
 * Get default line for a market
 */
function getDefaultLine(market: Market): number {
  switch (market) {
    case "Hits":
      return 0.5;
    case "Total Bases":
      return 1.5;
    case "Home Runs":
      return 0.5;
    case "Strikeouts":
      return 5.5;
    case "RBIs":
      return 0.5;
    default:
      return 0.5;
  }
}

/**
 * Mock function to fetch hit rate profiles with optional filtering
 */
export async function fetchMockHitRateProfiles(market: Market): Promise<PlayerHitRateProfile[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Return mock data
  return [
    {
      id: 1,
      player_id: 123,
      player_name: "Mock Player 1",
      team_name: "Mock Team",
      market: market,
      line: 1.5,
      last_5_hit_rate: 80,
      last_10_hit_rate: 75,
      last_20_hit_rate: 70,
      season_hit_rate: 65,
      avg_stat_per_game: 1.8,
      points_histogram: {
        last_5: { "0": 1, "1": 2, "2": 2 },
        last_10: { "0": 2, "1": 5, "2": 3 },
        last_20: { "0": 5, "1": 10, "2": 5 }
      }
    },
    // Add more mock players as needed
  ]
} 