export interface GameMarket {
  value: string;
  label: string;
  apiKey: string;
  description?: string;
  hasAlternates?: boolean;
  alternateKey?: string;
}

export interface GameMarkets {
  [key: string]: {
    gameLines: GameMarket[];
    futures?: GameMarket[];
    teamProps?: GameMarket[];
  };
}

export const GAME_MARKETS: GameMarkets = {
  baseball_mlb: {
    gameLines: [
      {
        value: "moneyline",
        label: "Moneyline",
        apiKey: "h2h",
        description: "Pick the winner of the game"
      },
      {
        value: "run_line",
        label: "Run Line",
        apiKey: "spreads",
        description: "Bet with a run spread (typically ±1.5)",
        hasAlternates: true,
        alternateKey: "alternate_spreads"
      },
      {
        value: "total",
        label: "Total Runs",
        apiKey: "totals",
        description: "Combined runs scored by both teams",
        hasAlternates: true,
        alternateKey: "alternate_totals"
      }
    ],
    teamProps: [
      {
        value: "team_total_runs",
        label: "Team Total Runs",
        apiKey: "team_totals",
        description: "Total runs scored by a specific team"
      },
      // First Inning Markets
      {
        value: "first_inning_moneyline",
        label: "First Inning ML",
        apiKey: "h2h_1st_1_innings",
        description: "Moneyline for first inning only"
      },
      {
        value: "first_inning_three_way",
        label: "First Inning ML (3-Way)",
        apiKey: "h2h_3_way_1st_1_innings",
        description: "Three-way moneyline for first inning"
      },
      {
        value: "first_inning_spread",
        label: "First Inning Spread",
        apiKey: "spreads_1st_1_innings",
        description: "Run spread for first inning",
        hasAlternates: true,
        alternateKey: "alternate_spreads_1st_1_innings"
      },
      {
        value: "first_inning_total",
        label: "First Inning Total",
        apiKey: "totals_1st_1_innings",
        description: "Total runs in first inning",
        hasAlternates: true,
        alternateKey: "alternate_totals_1st_1_innings"
      },
      // First 3 Innings Markets
      {
        value: "first_three_moneyline",
        label: "First 3 Innings ML",
        apiKey: "h2h_1st_3_innings",
        description: "Moneyline for first 3 innings"
      },
      {
        value: "first_three_three_way",
        label: "First 3 Innings ML (3-Way)",
        apiKey: "h2h_3_way_1st_3_innings",
        description: "Three-way moneyline for first 3 innings"
      },
      {
        value: "first_three_spread",
        label: "First 3 Innings Spread",
        apiKey: "spreads_1st_3_innings",
        description: "Run spread for first 3 innings",
        hasAlternates: true,
        alternateKey: "alternate_spreads_1st_3_innings"
      },
      {
        value: "first_three_total",
        label: "First 3 Innings Total",
        apiKey: "totals_1st_3_innings",
        description: "Total runs in first 3 innings",
        hasAlternates: true,
        alternateKey: "alternate_totals_1st_3_innings"
      },
      // First 5 Innings Markets
      {
        value: "first_five_moneyline",
        label: "First 5 Innings ML",
        apiKey: "h2h_1st_5_innings",
        description: "Moneyline for first 5 innings"
      },
      {
        value: "first_five_three_way",
        label: "First 5 Innings ML (3-Way)",
        apiKey: "h2h_3_way_1st_5_innings",
        description: "Three-way moneyline for first 5 innings"
      },
      {
        value: "first_five_spread",
        label: "First 5 Innings Spread",
        apiKey: "spreads_1st_5_innings",
        description: "Run spread for first 5 innings",
        hasAlternates: true,
        alternateKey: "alternate_spreads_1st_5_innings"
      },
      {
        value: "first_five_total",
        label: "First 5 Innings Total",
        apiKey: "totals_1st_5_innings",
        description: "Total runs in first 5 innings",
        hasAlternates: true,
        alternateKey: "alternate_totals_1st_5_innings"
      },
      // First 7 Innings Markets
      {
        value: "first_seven_moneyline",
        label: "First 7 Innings ML",
        apiKey: "h2h_1st_7_innings",
        description: "Moneyline for first 7 innings"
      },
      {
        value: "first_seven_three_way",
        label: "First 7 Innings ML (3-Way)",
        apiKey: "h2h_3_way_1st_7_innings",
        description: "Three-way moneyline for first 7 innings"
      },
      {
        value: "first_seven_spread",
        label: "First 7 Innings Spread",
        apiKey: "spreads_1st_7_innings",
        description: "Run spread for first 7 innings",
        hasAlternates: true,
        alternateKey: "alternate_spreads_1st_7_innings"
      },
      {
        value: "first_seven_total",
        label: "First 7 Innings Total",
        apiKey: "totals_1st_7_innings",
        description: "Total runs in first 7 innings",
        hasAlternates: true,
        alternateKey: "alternate_totals_1st_7_innings"
      }
    ],
    futures: [
      {
        value: "world_series_winner",
        label: "World Series Winner",
        apiKey: "championship_winner",
        description: "Team to win the World Series"
      },
      {
        value: "division_winner",
        label: "Division Winner",
        apiKey: "division_winner",
        description: "Team to win their division"
      }
    ]
  },

  basketball_nba: {
    gameLines: [
      {
        value: "moneyline",
        label: "Moneyline",
        apiKey: "h2h",
        description: "Pick the winner of the game"
      },
      {
        value: "spread",
        label: "Point Spread",
        apiKey: "spreads",
        description: "Bet with a point spread",
        hasAlternates: true,
        alternateKey: "alternate_spreads"
      },
      {
        value: "total",
        label: "Total Points",
        apiKey: "totals",
        description: "Combined points scored by both teams",
        hasAlternates: true,
        alternateKey: "alternate_totals"
      }
    ],
    teamProps: [
      {
        value: "team_total_points",
        label: "Team Total Points",
        apiKey: "team_totals",
        description: "Total points scored by a specific team",
        hasAlternates: true,
        alternateKey: "alternate_team_totals"
      },
      // Quarter Markets
      {
        value: "first_quarter_moneyline",
        label: "1st Quarter ML",
        apiKey: "h2h_q1",
        description: "Moneyline for first quarter"
      },
      {
        value: "first_quarter_three_way",
        label: "1st Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q1",
        description: "Three-way moneyline for first quarter"
      },
      {
        value: "first_quarter_spread",
        label: "1st Quarter Spread",
        apiKey: "spreads_q1",
        description: "Point spread for first quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q1"
      },
      {
        value: "first_quarter_total",
        label: "1st Quarter Total",
        apiKey: "totals_q1",
        description: "Total points in first quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q1"
      },
      {
        value: "first_quarter_team_total",
        label: "1st Quarter Team Total",
        apiKey: "team_totals_q1",
        description: "Team total points in first quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q1"
      },
      {
        value: "second_quarter_moneyline",
        label: "2nd Quarter ML",
        apiKey: "h2h_q2",
        description: "Moneyline for second quarter"
      },
      {
        value: "second_quarter_three_way",
        label: "2nd Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q2",
        description: "Three-way moneyline for second quarter"
      },
      {
        value: "second_quarter_spread",
        label: "2nd Quarter Spread",
        apiKey: "spreads_q2",
        description: "Point spread for second quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q2"
      },
      {
        value: "second_quarter_total",
        label: "2nd Quarter Total",
        apiKey: "totals_q2",
        description: "Total points in second quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q2"
      },
      {
        value: "second_quarter_team_total",
        label: "2nd Quarter Team Total",
        apiKey: "team_totals_q2",
        description: "Team total points in second quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q2"
      },
      {
        value: "third_quarter_moneyline",
        label: "3rd Quarter ML",
        apiKey: "h2h_q3",
        description: "Moneyline for third quarter"
      },
      {
        value: "third_quarter_three_way",
        label: "3rd Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q3",
        description: "Three-way moneyline for third quarter"
      },
      {
        value: "third_quarter_spread",
        label: "3rd Quarter Spread",
        apiKey: "spreads_q3",
        description: "Point spread for third quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q3"
      },
      {
        value: "third_quarter_total",
        label: "3rd Quarter Total",
        apiKey: "totals_q3",
        description: "Total points in third quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q3"
      },
      {
        value: "third_quarter_team_total",
        label: "3rd Quarter Team Total",
        apiKey: "team_totals_q3",
        description: "Team total points in third quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q3"
      },
      {
        value: "fourth_quarter_moneyline",
        label: "4th Quarter ML",
        apiKey: "h2h_q4",
        description: "Moneyline for fourth quarter"
      },
      {
        value: "fourth_quarter_three_way",
        label: "4th Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q4",
        description: "Three-way moneyline for fourth quarter"
      },
      {
        value: "fourth_quarter_spread",
        label: "4th Quarter Spread",
        apiKey: "spreads_q4",
        description: "Point spread for fourth quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q4"
      },
      {
        value: "fourth_quarter_total",
        label: "4th Quarter Total",
        apiKey: "totals_q4",
        description: "Total points in fourth quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q4"
      },
      {
        value: "fourth_quarter_team_total",
        label: "4th Quarter Team Total",
        apiKey: "team_totals_q4",
        description: "Team total points in fourth quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q4"
      },
      // Half Markets
      {
        value: "first_half_moneyline",
        label: "1st Half ML",
        apiKey: "h2h_h1",
        description: "Moneyline for first half"
      },
      {
        value: "first_half_three_way",
        label: "1st Half ML (3-Way)",
        apiKey: "h2h_3_way_h1",
        description: "Three-way moneyline for first half"
      },
      {
        value: "first_half_spread",
        label: "1st Half Spread",
        apiKey: "spreads_h1",
        description: "Point spread for first half",
        hasAlternates: true,
        alternateKey: "alternate_spreads_h1"
      },
      {
        value: "first_half_total",
        label: "1st Half Total",
        apiKey: "totals_h1",
        description: "Total points in first half",
        hasAlternates: true,
        alternateKey: "alternate_totals_h1"
      },
      {
        value: "first_half_team_total",
        label: "1st Half Team Total",
        apiKey: "team_totals_h1",
        description: "Team total points in first half",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_h1"
      },
      {
        value: "second_half_moneyline",
        label: "2nd Half ML",
        apiKey: "h2h_h2",
        description: "Moneyline for second half"
      },
      {
        value: "second_half_three_way",
        label: "2nd Half ML (3-Way)",
        apiKey: "h2h_3_way_h2",
        description: "Three-way moneyline for second half"
      },
      {
        value: "second_half_spread",
        label: "2nd Half Spread",
        apiKey: "spreads_h2",
        description: "Point spread for second half",
        hasAlternates: true,
        alternateKey: "alternate_spreads_h2"
      },
      {
        value: "second_half_total",
        label: "2nd Half Total",
        apiKey: "totals_h2",
        description: "Total points in second half",
        hasAlternates: true,
        alternateKey: "alternate_totals_h2"
      },
      {
        value: "second_half_team_total",
        label: "2nd Half Team Total",
        apiKey: "team_totals_h2",
        description: "Team total points in second half",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_h2"
      }
    ],
    futures: [
      {
        value: "championship_winner",
        label: "Championship Winner",
        apiKey: "championship_winner",
        description: "Team to win the NBA Championship"
      },
      {
        value: "conference_winner",
        label: "Conference Winner",
        apiKey: "conference_winner",
        description: "Team to win their conference"
      }
    ]
  },

  football_nfl: {
    gameLines: [
      {
        value: "moneyline",
        label: "Moneyline",
        apiKey: "h2h",
        description: "Pick the winner of the game"
      },
      {
        value: "spread",
        label: "Point Spread",
        apiKey: "spreads",
        description: "Bet with a point spread",
        hasAlternates: true,
        alternateKey: "alternate_spreads"
      },
      {
        value: "total",
        label: "Total Points",
        apiKey: "totals",
        description: "Combined points scored by both teams",
        hasAlternates: true,
        alternateKey: "alternate_totals"
      }
    ],
    teamProps: [
      {
        value: "team_total_points",
        label: "Team Total Points",
        apiKey: "team_totals",
        description: "Total points scored by a specific team",
        hasAlternates: true,
        alternateKey: "alternate_team_totals"
      },
      // Quarter Markets
      {
        value: "first_quarter_moneyline",
        label: "1st Quarter ML",
        apiKey: "h2h_q1",
        description: "Moneyline for first quarter"
      },
      {
        value: "first_quarter_three_way",
        label: "1st Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q1",
        description: "Three-way moneyline for first quarter"
      },
      {
        value: "first_quarter_spread",
        label: "1st Quarter Spread",
        apiKey: "spreads_q1",
        description: "Point spread for first quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q1"
      },
      {
        value: "first_quarter_total",
        label: "1st Quarter Total",
        apiKey: "totals_q1",
        description: "Total points in first quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q1"
      },
      {
        value: "first_quarter_team_total",
        label: "1st Quarter Team Total",
        apiKey: "team_totals_q1",
        description: "Team total points in first quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q1"
      },
      {
        value: "second_quarter_moneyline",
        label: "2nd Quarter ML",
        apiKey: "h2h_q2",
        description: "Moneyline for second quarter"
      },
      {
        value: "second_quarter_three_way",
        label: "2nd Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q2",
        description: "Three-way moneyline for second quarter"
      },
      {
        value: "second_quarter_spread",
        label: "2nd Quarter Spread",
        apiKey: "spreads_q2",
        description: "Point spread for second quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q2"
      },
      {
        value: "second_quarter_total",
        label: "2nd Quarter Total",
        apiKey: "totals_q2",
        description: "Total points in second quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q2"
      },
      {
        value: "second_quarter_team_total",
        label: "2nd Quarter Team Total",
        apiKey: "team_totals_q2",
        description: "Team total points in second quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q2"
      },
      {
        value: "third_quarter_moneyline",
        label: "3rd Quarter ML",
        apiKey: "h2h_q3",
        description: "Moneyline for third quarter"
      },
      {
        value: "third_quarter_three_way",
        label: "3rd Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q3",
        description: "Three-way moneyline for third quarter"
      },
      {
        value: "third_quarter_spread",
        label: "3rd Quarter Spread",
        apiKey: "spreads_q3",
        description: "Point spread for third quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q3"
      },
      {
        value: "third_quarter_total",
        label: "3rd Quarter Total",
        apiKey: "totals_q3",
        description: "Total points in third quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q3"
      },
      {
        value: "third_quarter_team_total",
        label: "3rd Quarter Team Total",
        apiKey: "team_totals_q3",
        description: "Team total points in third quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q3"
      },
      {
        value: "fourth_quarter_moneyline",
        label: "4th Quarter ML",
        apiKey: "h2h_q4",
        description: "Moneyline for fourth quarter"
      },
      {
        value: "fourth_quarter_three_way",
        label: "4th Quarter ML (3-Way)",
        apiKey: "h2h_3_way_q4",
        description: "Three-way moneyline for fourth quarter"
      },
      {
        value: "fourth_quarter_spread",
        label: "4th Quarter Spread",
        apiKey: "spreads_q4",
        description: "Point spread for fourth quarter",
        hasAlternates: true,
        alternateKey: "alternate_spreads_q4"
      },
      {
        value: "fourth_quarter_total",
        label: "4th Quarter Total",
        apiKey: "totals_q4",
        description: "Total points in fourth quarter",
        hasAlternates: true,
        alternateKey: "alternate_totals_q4"
      },
      {
        value: "fourth_quarter_team_total",
        label: "4th Quarter Team Total",
        apiKey: "team_totals_q4",
        description: "Team total points in fourth quarter",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_q4"
      },
      // Half Markets
      {
        value: "first_half_moneyline",
        label: "1st Half ML",
        apiKey: "h2h_h1",
        description: "Moneyline for first half"
      },
      {
        value: "first_half_three_way",
        label: "1st Half ML (3-Way)",
        apiKey: "h2h_3_way_h1",
        description: "Three-way moneyline for first half"
      },
      {
        value: "first_half_spread",
        label: "1st Half Spread",
        apiKey: "spreads_h1",
        description: "Point spread for first half",
        hasAlternates: true,
        alternateKey: "alternate_spreads_h1"
      },
      {
        value: "first_half_total",
        label: "1st Half Total",
        apiKey: "totals_h1",
        description: "Total points in first half",
        hasAlternates: true,
        alternateKey: "alternate_totals_h1"
      },
      {
        value: "first_half_team_total",
        label: "1st Half Team Total",
        apiKey: "team_totals_h1",
        description: "Team total points in first half",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_h1"
      },
      {
        value: "second_half_moneyline",
        label: "2nd Half ML",
        apiKey: "h2h_h2",
        description: "Moneyline for second half"
      },
      {
        value: "second_half_three_way",
        label: "2nd Half ML (3-Way)",
        apiKey: "h2h_3_way_h2",
        description: "Three-way moneyline for second half"
      },
      {
        value: "second_half_spread",
        label: "2nd Half Spread",
        apiKey: "spreads_h2",
        description: "Point spread for second half",
        hasAlternates: true,
        alternateKey: "alternate_spreads_h2"
      },
      {
        value: "second_half_total",
        label: "2nd Half Total",
        apiKey: "totals_h2",
        description: "Total points in second half",
        hasAlternates: true,
        alternateKey: "alternate_totals_h2"
      },
      {
        value: "second_half_team_total",
        label: "2nd Half Team Total",
        apiKey: "team_totals_h2",
        description: "Team total points in second half",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_h2"
      }
    ],
    futures: [
      {
        value: "super_bowl_winner",
        label: "Super Bowl Winner",
        apiKey: "championship_winner",
        description: "Team to win the Super Bowl"
      },
      {
        value: "conference_winner",
        label: "Conference Winner",
        apiKey: "conference_winner",
        description: "Team to win their conference"
      }
    ]
  },

  football_ncaaf: {
    gameLines: [
      {
        value: "moneyline",
        label: "Moneyline",
        apiKey: "h2h",
        description: "Pick the winner of the game",
      },
      {
        value: "spread",
        label: "Point Spread",
        apiKey: "spreads",
        description: "Bet with a point spread",
        hasAlternates: true,
        alternateKey: "alternate_spreads",
      },
      {
        value: "total",
        label: "Total Points",
        apiKey: "totals",
        description: "Combined points scored by both teams",
        hasAlternates: true,
        alternateKey: "alternate_totals",
      },
    ],
  },

  icehockey_nhl: {
    gameLines: [
      {
        value: "moneyline",
        label: "Moneyline",
        apiKey: "h2h",
        description: "Pick the winner of the game"
      },
      {
        value: "puck_line",
        label: "Puck Line",
        apiKey: "spreads",
        description: "Bet with a goal spread (typically ±1.5)",
        hasAlternates: true,
        alternateKey: "alternate_spreads"
      },
      {
        value: "total",
        label: "Total Goals",
        apiKey: "totals",
        description: "Combined goals scored by both teams",
        hasAlternates: true,
        alternateKey: "alternate_totals"
      }
    ],
    teamProps: [
      {
        value: "team_total_goals",
        label: "Team Total Goals",
        apiKey: "team_totals",
        description: "Total goals scored by a specific team",
        hasAlternates: true,
        alternateKey: "alternate_team_totals"
      },
      // First Period Markets
      {
        value: "first_period_moneyline",
        label: "1st Period ML",
        apiKey: "h2h_p1",
        description: "Moneyline for first period"
      },
      {
        value: "first_period_three_way",
        label: "1st Period ML (3-Way)",
        apiKey: "h2h_3_way_p1",
        description: "Three-way moneyline for first period"
      },
      {
        value: "first_period_spread",
        label: "1st Period Spread",
        apiKey: "spreads_p1",
        description: "Goal spread for first period",
        hasAlternates: true,
        alternateKey: "alternate_spreads_p1"
      },
      {
        value: "first_period_total",
        label: "1st Period Total",
        apiKey: "totals_p1",
        description: "Total goals in first period",
        hasAlternates: true,
        alternateKey: "alternate_totals_p1"
      },
      {
        value: "first_period_team_total",
        label: "1st Period Team Total",
        apiKey: "team_totals_p1",
        description: "Team total goals in first period",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_p1"
      },
      // Second Period Markets
      {
        value: "second_period_moneyline",
        label: "2nd Period ML",
        apiKey: "h2h_p2",
        description: "Moneyline for second period"
      },
      {
        value: "second_period_three_way",
        label: "2nd Period ML (3-Way)",
        apiKey: "h2h_3_way_p2",
        description: "Three-way moneyline for second period"
      },
      {
        value: "second_period_spread",
        label: "2nd Period Spread",
        apiKey: "spreads_p2",
        description: "Goal spread for second period",
        hasAlternates: true,
        alternateKey: "alternate_spreads_p2"
      },
      {
        value: "second_period_total",
        label: "2nd Period Total",
        apiKey: "totals_p2",
        description: "Total goals in second period",
        hasAlternates: true,
        alternateKey: "alternate_totals_p2"
      },
      {
        value: "second_period_team_total",
        label: "2nd Period Team Total",
        apiKey: "team_totals_p2",
        description: "Team total goals in second period",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_p2"
      },
      // Third Period Markets
      {
        value: "third_period_moneyline",
        label: "3rd Period ML",
        apiKey: "h2h_p3",
        description: "Moneyline for third period"
      },
      {
        value: "third_period_three_way",
        label: "3rd Period ML (3-Way)",
        apiKey: "h2h_3_way_p3",
        description: "Three-way moneyline for third period"
      },
      {
        value: "third_period_spread",
        label: "3rd Period Spread",
        apiKey: "spreads_p3",
        description: "Goal spread for third period",
        hasAlternates: true,
        alternateKey: "alternate_spreads_p3"
      },
      {
        value: "third_period_total",
        label: "3rd Period Total",
        apiKey: "totals_p3",
        description: "Total goals in third period",
        hasAlternates: true,
        alternateKey: "alternate_totals_p3"
      },
      {
        value: "third_period_team_total",
        label: "3rd Period Team Total",
        apiKey: "team_totals_p3",
        description: "Team total goals in third period",
        hasAlternates: true,
        alternateKey: "alternate_team_totals_p3"
      }
    ],
    futures: [
      {
        value: "stanley_cup_winner",
        label: "Stanley Cup Winner",
        apiKey: "championship_winner",
        description: "Team to win the Stanley Cup"
      },
      {
        value: "conference_winner",
        label: "Conference Winner",
        apiKey: "conference_winner",
        description: "Team to win their conference"
      }
    ]
  }
};

// Helper functions
export function getGameLinesForSport(sport: string): GameMarket[] {
  return GAME_MARKETS[sport]?.gameLines || [];
}

export function getTeamPropsForSport(sport: string): GameMarket[] {
  return GAME_MARKETS[sport]?.teamProps || [];
}

export function getFuturesForSport(sport: string): GameMarket[] {
  return GAME_MARKETS[sport]?.futures || [];
}

export function getMarketApiKey(
  sport: string,
  marketValue: string,
  useAlternate: boolean = false
): string {
  // Normalize sport aliases
  const s = (() => {
    const lower = sport.toLowerCase()
    if (lower === 'mlb' || lower === 'baseball_mlb') return 'baseball_mlb'
    if (lower === 'nfl' || lower === 'football_nfl' || lower === 'americanfootball_nfl') return 'football_nfl'
    if (lower === 'ncaaf' || lower === 'football_ncaaf' || lower === 'americanfootball_ncaaf') return 'football_ncaaf'
    if (lower === 'nba' || lower === 'basketball_nba') return 'basketball_nba'
    if (lower === 'nhl' || lower === 'icehockey_nhl') return 'icehockey_nhl'
    return sport
  })()
  // Normalize market aliases for VALUE matching (not API key)
  const v = (() => {
    const m = (marketValue || '').toLowerCase()
    if (m === 'h2h' || m === 'moneyline' || m === 'ml') return 'moneyline'
    if (m === 'total' || m === 'totals') return 'total'
    if (m === 'spread' || m === 'spreads') return 'spread'
    if (m === 'runline') return 'run_line'
    if (m === 'puckline') return 'puck_line'
    return m
  })()
  // Check game lines
  const gameLines = getGameLinesForSport(s);
  const gameLine = gameLines.find((m) => m.value === v);
  if (gameLine) {
    if (useAlternate && gameLine.hasAlternates && gameLine.alternateKey) {
      return gameLine.alternateKey;
    }
    return gameLine.apiKey;
  }

  // Check team props
  const teamProps = getTeamPropsForSport(s);
  const teamProp = teamProps.find((m) => m.value === v);
  if (teamProp) {
    return teamProp.apiKey;
  }

  // Check futures
  const futures = getFuturesForSport(s);
  const future = futures.find((m) => m.value === v);
  if (future) {
    return future.apiKey;
  }

  return "h2h"; // Default to moneyline if not found
}

// Export supported sports array
export const SUPPORTED_SPORTS = ['baseball_mlb', 'basketball_nba', 'football_nfl', 'icehockey_nhl'] as const; 