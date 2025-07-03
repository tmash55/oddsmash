// Test script for LLM parsing
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Mock the market mapping function
function getMarketApiKey(sport, marketValue, useAlternate = false) {
  const SPORT_MARKETS = {
    'baseball_mlb': [
      {
        value: "Strikeouts",
        label: "Strikeouts", 
        apiKey: "pitcher_strikeouts",
        hasAlternates: true,
        alternateKey: "pitcher_strikeouts_alternate",
        alwaysFetchAlternate: true,
      }
    ]
  }
  
  const market = SPORT_MARKETS[sport]?.find(m => m.value === marketValue)
  if (!market) return "player_points"

  if (useAlternate && market.hasAlternates && market.alternateKey) {
    return market.alternateKey
  }

  return market.apiKey
}

function mapSportToApiKey(sport) {
  const sportMapping = {
    'Baseball': 'baseball_mlb',
    'Basketball': 'basketball_nba',
    'Hockey': 'icehockey_nhl',
    'Football': 'americanfootball_nfl',
    'College Basketball': 'basketball_ncaab',
    'College Football': 'americanfootball_ncaaf'
  }
  
  return sportMapping[sport] || 'baseball_mlb'
}

async function testLLMParsing() {
  console.log('🤖 Testing comprehensive LLM parsing and market mapping...')
  
  // Test multiple OCR variations that might occur with different text extraction methods
  const ocrVariations = [
    // Variation 1: Clean structured text (what we expect)
    {
      name: "Clean Structured",
      text: `Bet Placed
5 Pick Parlay
CASH OUT +20% PARLAY BOOST
+1105

6+
Jacob deGrom Strikeouts Thrown
TEX Rangers @ PIT Pirates • Today 6:40 PM
Player must start and throw at least one pitch.

6+
Max Fried Strikeouts Thrown
BAL Orioles @ NY Yankees • Today 7:05 PM
Player must start and throw at least one pitch.

6+
Zac Gallen Strikeouts Thrown
ARI Diamondbacks @ COL Rockies • Today 8:40 PM
Player must start and throw at least one pitch.

7+
Hunter Brown Strikeouts Thrown
HOU Astros @ LA Angels • Today 9:38 PM
Player must start and throw at least one pitch.

5+
Jacob Misiorowski Strikeouts Thrown
MIL Brewers @ MIN Twins • Today 8:05 PM
Player must start and throw at least one pitch.`
    },
    
    // Variation 2: Messy OCR with line breaks and extra characters
    {
      name: "Messy OCR",
      text: `Bet Placed
5 Pick Parlay
CASH OUT ⚡ +20% PARLAY BOOST
+1105

6+
Jacob deGrom Strikeouts Thrown
TEX Rangers @ PIT Pirates • Today 6:40 PM
Player must start and throw at least one pitch.

6+
Max Fried Strikeouts Thrown
BAL Orioles @ NY Yankees • Today 7:05 PM
Player must start and throw at least one pitch.

6+
Zac Gallen Strikeouts Thrown  
ARI Diamondbacks @ COL Rockies • Today 8:40 PM
Player must start and throw at least one pitch.

7+
Hunter Brown Strikeouts Thrown
HOU Astros @ LA Angels • Today 9:38 PM
Player must start and throw at least one pitch.

5+
Jacob Misiorowski Strikeouts Thrown
MIL Brewers @ MIN Twins • Today 8:05 PM
Player must start and throw at least one pitch.`
    },
    
    // Variation 3: Compact/condensed format (what might happen with poor OCR)
    {
      name: "Compact Format",
      text: `Bet Placed 5 Pick Parlay CASH OUT +20% PARLAY BOOST +1105
6+ Jacob deGrom Strikeouts Thrown TEX Rangers @ PIT Pirates • Today 6:40 PM Player must start and throw at least one pitch.
6+ Max Fried Strikeouts Thrown BAL Orioles @ NY Yankees • Today 7:05 PM Player must start and throw at least one pitch.
6+ Zac Gallen Strikeouts Thrown ARI Diamondbacks @ COL Rockies • Today 8:40 PM Player must start and throw at least one pitch.
7+ Hunter Brown Strikeouts Thrown HOU Astros @ LA Angels • Today 9:38 PM Player must start and throw at least one pitch.
5+ Jacob Misiorowski Strikeouts Thrown MIL Brewers @ MIN Twins • Today 8:05 PM Player must start and throw at least one pitch.`
    }
  ]

  for (const variation of ocrVariations) {
    console.log(`\n📝 Testing ${variation.name} format...`)
    
    const selections = await parseWithLLM(variation.text)
    
    console.log(`✅ Found ${selections.length} selections:`)
    selections.forEach((selection, i) => {
      const sportApiKey = mapSportToApiKey(selection.sport)
      const marketApiKey = getMarketApiKey(sportApiKey, selection.market)
      
      console.log(`   ${i + 1}. ${selection.player} - ${selection.market} ${selection.line}+ (${selection.odds})`)
      console.log(`      Sport: ${selection.sport} -> ${sportApiKey}`)
      console.log(`      Market: ${selection.market} -> ${marketApiKey}`)
      console.log(`      Teams: ${selection.awayTeam} @ ${selection.homeTeam}`)
    })
    
    if (selections.length !== 5) {
      console.log(`⚠️  Expected 5 selections, got ${selections.length}`)
    }
  }
}

async function parseWithLLM(ocrText) {
  try {
    const prompt = `You are an expert sports betting slip parser. Extract all individual player prop bets from this OCR text from ANY sportsbook (FanDuel, DraftKings, BetMGM, Caesars, ESPN BET, etc.).

CRITICAL PARLAY PARSING RULES:
- If this is a parlay bet, DO NOT use the total parlay odds (like +3200) for individual selections
- Look for individual odds listed near each player's selection (like +450, -120, etc.)
- If a selection doesn't have individual odds listed, use "N/A" for odds
- Total parlay odds (usually large numbers like +3200, +650) should be ignored for individual selections
- Each player should have their own individual odds, not the combined parlay odds

SPORTSBOOK FORMAT VARIATIONS:
- FanDuel: "TO HIT A HOME RUN", "TO RECORD X+ HITS", "PROFIT BOOST"
- DraftKings: "Same Game Parlay", "SGP", different layout
- BetMGM: "Player Props", different team format
- Caesars: "Boosts", different odds display
- Handle any sportsbook's unique terminology and layout

SPORT DETECTION:
- Look for sport indicators in team names, player names, and markets
- Common sports: "Baseball/MLB", "Basketball/NBA", "Hockey/NHL", "Football/NFL"
- Return the sport as one of: "Baseball", "Basketball", "Hockey", "Football"

MARKET STANDARDIZATION (works across all sportsbooks):
- "TO HIT A HOME RUN", "HOME RUN", "HR" → "Home_Runs"
- "TO HIT A DOUBLE", "TO RECORD A DOUBLE", "DOUBLE", "2B" → "Doubles"
- "TO HIT A TRIPLE", "TO RECORD A TRIPLE", "TRIPLE", "3B" → "Triples"
- "TO HIT A SINGLE", "TO RECORD A SINGLE", "SINGLE", "1B" → "Singles"
- "TO RECORD A STOLEN BASE", "STOLEN BASE", "SB" → "Stolen_Bases"  
- "TO RECORD X+ HITS", "X+ HITS", "HITS" → "Hits"
- "X+ STRIKEOUTS", "STRIKEOUTS", "K's", "SO", "Strikeouts Thrown" → "Strikeouts"
- "TO RECORD X+ TOTAL BASES", "X+ TOTAL BASES", "TB" → "Total_Bases"
- "TO RECORD X+ RBIS", "X+ RBIS", "RBI", "RUNS BATTED IN" → "RBIs"
- "POINTS", "PTS" → "Points"
- "REBOUNDS", "REB" → "Rebounds"
- "ASSISTS", "AST" → "Assists"
- "GOALS" → "Goals"
- "SHOTS ON GOAL", "SOG" → "Shots"

LINE EXTRACTION RULES:
IMPORTANT: Strikeouts are ALWAYS offered in whole numbers - do NOT add 0.5!
- For "X+ STRIKEOUTS": Keep the exact number (e.g., "6+ strikeouts" → line: 6, "7+ strikeouts" → line: 7, "8+ strikeouts" → line: 8)
- For other "X+" markets: Convert to X-0.5 (e.g., "2+ total bases" → line: 1.5, "2+ hits" → line: 1.5)
- For "TO HIT A HOME RUN" (no number) → line: 0.5
- For "TO HIT A DOUBLE" (no number) → line: 0.5
- For "TO HIT A TRIPLE" (no number) → line: 0.5
- For "TO HIT A SINGLE" (no number) → line: 0.5
- For "TO RECORD A HIT" (no number) → line: 0.5
- For "TO RECORD A STOLEN BASE" (no number) → line: 0.5
- STRIKEOUTS ARE SPECIAL: "6+ strikeouts" = line: 6 (NOT 5.5), "7+ strikeouts" = line: 7 (NOT 6.5)

TEAM NAME VARIATIONS:
- Handle abbreviations: "NYY" = "New York Yankees", "LAD" = "Los Angeles Dodgers"
- Handle @ vs "at" vs "vs" in matchups
- Extract both full team names and abbreviations

ODDS PARSING EXAMPLES:
For this text: "2 leg parlay Yainer Diaz To Hit A Home Run, Gavin Sheets To Hit A Home Run +3200 Yainer Diaz TO HIT A HOME RUN Houston Astros @ Athletics Gavin Sheets TO HIT A HOME RUN +450"
- "+3200" is the TOTAL PARLAY ODDS - ignore this for individual selections
- "+450" appears near Gavin Sheets, so that's his individual odds
- Yainer Diaz has no individual odds listed, so use "N/A"

SPECIAL ATTENTION FOR THIS BETSLIP:
- This is a FanDuel strikeout parlay with 5 picks
- Each player has a line like "6+", "7+", "5+" before their name
- The market is "Strikeouts Thrown" for all players
- There are NO individual odds shown for each player (this is common in FanDuel parlays)
- Use "N/A" for odds since no individual odds are displayed
- Extract the line number from the "X+" format (e.g., "6+" = line: 6)
- PARSE ALL 5 PLAYERS - do not skip any selections

RULES:
1. Only extract individual player props, ignore team totals
2. Standardize market names using the mapping above
3. Extract exact player names (First Last format)
4. For odds: find odds specifically associated with each player, ignore parlay totals
5. Parse team matchups from game info lines
6. Extract game times in original format
7. Extract line values using the rules above
8. Ignore single characters, team logos, or UI elements
9. Detect the sport based on context clues
10. If individual odds are not clear, use "N/A" rather than guessing
11. Handle any sportsbook format - focus on core betting information
12. EXTRACT ALL PLAYERS - this betslip has 5 strikeout picks, return all 5

OCR TEXT:
${ocrText}

Return a valid JSON array with this exact format:
[
  {
    "player": "Player Name",
    "sport": "Baseball",
    "market": "Strikeouts",
    "line": 6,
    "odds": "N/A",
    "awayTeam": "Away Team",
    "homeTeam": "Home Team",
    "gameTime": "6:40 PM"
  }
]

Return only the JSON array, no other text.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)

  } catch (error) {
    console.error('❌ LLM parsing failed:', error)
    return []
  }
}

testLLMParsing().catch(console.error) 