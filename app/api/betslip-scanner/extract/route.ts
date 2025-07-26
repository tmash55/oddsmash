import { NextRequest, NextResponse } from 'next/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import OpenAI from 'openai'
import { getMarketApiKey, getMarketsForSport, type SportMarket } from '@/lib/constants/markets'
import { createClient } from '@/libs/supabase/server'
import { sportsbooks } from '@/data/sportsbooks'
import { calculateAllHitRatesForLine, shouldRecalculateForLine } from "@/lib/hit-rate-calculator"
import { getGoogleCredentials, hasGoogleCredentials } from '@/lib/google-credentials-simple'
import { getBaseUrl } from '@/lib/url-utils'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface BetSelection {
  id: string
  player?: string
  market: string
  line?: number
  betType: 'over' | 'under' | 'moneyline' | 'spread'
  sport: string
  sportApiKey: string // The odds API sport key (e.g., 'baseball_mlb')
  marketApiKey: string // The odds API market key (e.g., 'batter_home_runs')
  gameId?: string // Will be populated after event matching
  confidence: number
  rawText: string
  metadata: {
    odds?: string
    awayTeam?: string
    homeTeam?: string
    gameTime?: string
    gameDate?: string
  }
}

interface BetslipExtraction {
  selections: BetSelection[]
  confidence: number
  rawText: string
  metadata: {
    sportsbook?: string
    totalOdds?: string
    wagerAmount?: string
    totalPayout?: string
  }
}

// Game data interface for event matching
interface GameData {
  sport_key: string
  event_id: string
  commence_time: string
  home_team: {
    name: string
    abbreviation: string
  }
  away_team: {
    name: string
    abbreviation: string
  }
  status: string
}

// Types for odds fetching (matching refresh endpoint)
interface Outcome {
  name: string
  price: number
  point?: number
  description?: string
  sid?: string
  link?: string
}

interface Market {
  key: string
  outcomes: Outcome[]
}

interface Bookmaker {
  key: string
  title: string
  last_update: string
  markets: Market[]
}

interface OddsResponse {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}

interface OddsMetadata {
  matches_found: number
  total_bookmakers: number
  best_odds: number | null
  best_book: string | null
  player_searched: string
  line_searched: number
  bet_type_searched: string
  market_searched: string
  last_updated: string
  error?: string
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Google Vision client
let visionClient: ImageAnnotatorClient | null = null

function getVisionClient() {
  if (!visionClient) {
    try {
      // Check if Google credentials are configured
      if (hasGoogleCredentials()) {
        const credentials = getGoogleCredentials()
        
        visionClient = new ImageAnnotatorClient({
          credentials,
          projectId: credentials.project_id
        })
        console.log('✅ Google Vision API initialized successfully with environment variables')
      } else {
        console.warn('⚠️ Google Vision API credentials not found in environment variables, using mock OCR')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Vision API:', error)
      console.error('Falling back to mock OCR for development')
    }
  }
  return visionClient
}

// Real OCR function using Google Vision API
async function extractTextFromImageWithVision(imageBuffer: Buffer): Promise<string> {
  const client = getVisionClient()
  
  if (!client) {
    console.log('⚠️ Google Vision not configured, using mock extraction')
    return await extractTextFromImageMock(imageBuffer)
  }

  try {
    console.log('🔍 Starting Google Vision OCR extraction...')
    
    let structuredText = ''
    let documentText = ''
    
    // Method 1: Document Text Detection (best for structured documents like betslips)
    console.log('Method 1: Document text detection...')
    try {
      const [documentResult] = await client.documentTextDetection({
        image: { content: new Uint8Array(imageBuffer) },
      })

      if (documentResult.fullTextAnnotation?.text) {
        documentText = documentResult.fullTextAnnotation.text
        console.log('Document text detection successful, extracted text length:', documentText.length)
      }

      
      // Try to extract structured text using the document hierarchy
      if (documentResult.fullTextAnnotation.pages && documentResult.fullTextAnnotation.pages[0]) {
        const page = documentResult.fullTextAnnotation.pages[0]
        console.log(`Document structure: ${page.blocks?.length || 0} blocks`)
        
        // Build structured text by processing blocks, paragraphs, and words
        if (page.blocks) {
          const structuredLines: string[] = []
          
          for (const block of page.blocks) {
            if (block.paragraphs) {
              for (const paragraph of block.paragraphs) {
                if (paragraph.words) {
                  const words = paragraph.words.map(word => {
                    if (word.symbols) {
                      return word.symbols.map(symbol => symbol.text || '').join('')
                    }
                    return ''
                  }).filter(word => word.length > 0)
                  
                  if (words.length > 0) {
                    structuredLines.push(words.join(' '))
                  }
                }
              }
            }
          }
          
          structuredText = structuredLines.join('\n')
          console.log('Structured text extraction successful, lines:', structuredLines.length)
        }
      }
    } catch (docError) {
      console.log('Document text detection failed:', docError.message)
    }
    
    // Method 2: Regular Text Detection (fallback)
    console.log('Method 2: Regular text detection...')
    let regularText = ''
    let detailsText = ''
    
    try {
      const [textResult] = await client.textDetection({
        image: { content: new Uint8Array(imageBuffer) },
      })
      
      if (textResult.textAnnotations && textResult.textAnnotations.length > 0) {
        // The first annotation contains the full text
        regularText = textResult.textAnnotations[0].description || ''
        console.log('Regular text detection successful, extracted text length:', regularText.length)
        
        // Also extract individual text annotations with positions for better structure
        const individualTexts = textResult.textAnnotations.slice(1).map(annotation => ({
          text: annotation.description || '',
          bounds: annotation.boundingPoly
        }))
        
        // Try to reconstruct text based on position (top to bottom, left to right)
        if (individualTexts.length > 0) {
          // Sort by Y position (top to bottom), then X position (left to right)
          const sortedTexts = individualTexts.sort((a, b) => {
            if (!a.bounds?.vertices || !b.bounds?.vertices) return 0
            
            const aY = a.bounds.vertices[0]?.y || 0
            const bY = b.bounds.vertices[0]?.y || 0
            const aX = a.bounds.vertices[0]?.x || 0
            const bX = b.bounds.vertices[0]?.x || 0
            
            // If Y positions are close (same line), sort by X
            if (Math.abs(aY - bY) < 20) {
              return aX - bX
            }
            
            return aY - bY
          })
          
          // Group texts by approximate Y position (lines)
          const lines: string[][] = []
          let currentLine: string[] = []
          let lastY = -1
          
          for (const item of sortedTexts) {
            const y = item.bounds?.vertices?.[0]?.y || 0
            
            // If this is a new line (Y position changed significantly)
            if (lastY !== -1 && Math.abs(y - lastY) > 20) {
              if (currentLine.length > 0) {
                lines.push([...currentLine])
                currentLine = []
              }
            }
            
            currentLine.push(item.text)
            lastY = y
          }
          
          // Add the last line
          if (currentLine.length > 0) {
            lines.push(currentLine)
          }
          
          detailsText = lines.map(line => line.join(' ')).join('\n')
          console.log('Position-based text reconstruction successful, lines:', lines.length)
        }
      }
    } catch (textError) {
      console.log('Regular text detection failed:', textError.message)
    }

    // Method 3: Enhanced FanDuel-specific extraction
    console.log('Method 3: Enhanced FanDuel-specific extraction...')
    let fanDuelText = ''
    
    try {
      // Use more aggressive OCR settings for FanDuel betslips
      const [enhancedResult] = await client.textDetection({
        image: { 
          content: new Uint8Array(imageBuffer)
        },
        imageContext: {
          languageHints: ['en'],
          textDetectionParams: {
            enableTextDetectionConfidenceScore: true
          }
        }
      })
      
      if (enhancedResult.textAnnotations && enhancedResult.textAnnotations.length > 0) {
        // Filter out low-confidence detections and reconstruct
        const confidentTexts = enhancedResult.textAnnotations.slice(1)
          .filter(annotation => {
            // Only include text that looks like it could be part of a betslip
            const text = annotation.description || ''
            return text.length > 0 && 
                   !text.match(/^[^\w\s]$/) && // Skip single special characters
                   text.trim().length > 0
          })
          .map(annotation => ({
            text: annotation.description || '',
            bounds: annotation.boundingPoly,
            confidence: annotation.confidence || 0
          }))
        
        // Sort by position and reconstruct
        const sortedConfidentTexts = confidentTexts.sort((a, b) => {
          if (!a.bounds?.vertices || !b.bounds?.vertices) return 0
          
          const aY = a.bounds.vertices[0]?.y || 0
          const bY = b.bounds.vertices[0]?.y || 0
          const aX = a.bounds.vertices[0]?.x || 0
          const bX = b.bounds.vertices[0]?.x || 0
          
          // If Y positions are close (same line), sort by X
          if (Math.abs(aY - bY) < 25) {
            return aX - bX
          }
          
          return aY - bY
        })
        
        // Group into lines with better line detection for FanDuel format
        const fanDuelLines: string[] = []
        let currentFanDuelLine: string[] = []
        let lastFanDuelY = -1
        
        for (const item of sortedConfidentTexts) {
          const y = item.bounds?.vertices?.[0]?.y || 0
          
          // FanDuel has tighter line spacing, so use smaller threshold
          if (lastFanDuelY !== -1 && Math.abs(y - lastFanDuelY) > 15) {
            if (currentFanDuelLine.length > 0) {
              fanDuelLines.push(currentFanDuelLine.join(' '))
              currentFanDuelLine = []
            }
          }
          
          currentFanDuelLine.push(item.text)
          lastFanDuelY = y
        }
        
        // Add the last line
        if (currentFanDuelLine.length > 0) {
          fanDuelLines.push(currentFanDuelLine.join(' '))
        }
        
        fanDuelText = fanDuelLines.join('\n')
        console.log('FanDuel-specific extraction successful, lines:', fanDuelLines.length)
      }
    } catch (enhancedError) {
      console.log('Enhanced FanDuel extraction failed:', enhancedError.message)
    }
    
    // Choose the best text based on length, structure, and content
    const candidates = [
      { text: structuredText, name: 'structured', length: structuredText.length },
      { text: documentText, name: 'document', length: documentText.length },
      { text: detailsText, name: 'position-based', length: detailsText.length },
      { text: regularText, name: 'regular', length: regularText.length },
      { text: fanDuelText, name: 'fanduel-enhanced', length: fanDuelText.length }
    ].filter(candidate => candidate.length > 0)
    
    if (candidates.length === 0) {
      throw new Error('No text detected in image')
    }
    
    // Sort by length (longer is usually better for betslips) but also consider content quality
    candidates.sort((a, b) => {
      // Prioritize candidates that contain key betslip terms
      const aHasKey = a.text.toLowerCase().includes('strikeout') || 
                      a.text.toLowerCase().includes('parlay') ||
                      a.text.toLowerCase().includes('pick')
      const bHasKey = b.text.toLowerCase().includes('strikeout') || 
                      b.text.toLowerCase().includes('parlay') ||
                      b.text.toLowerCase().includes('pick')
      
      if (aHasKey && !bHasKey) return -1
      if (!aHasKey && bHasKey) return 1
      
      // If both have key terms or neither do, sort by length
      return b.length - a.length
    })
    
    const bestCandidate = candidates[0]
    console.log(`Using ${bestCandidate.name} text extraction (${bestCandidate.length} chars)`)
    
    // Log first 500 chars of each method for debugging
    console.log('\n📊 OCR Results Comparison:')
    candidates.forEach(candidate => {
      const preview = candidate.text.substring(0, 200).replace(/\n/g, ' ')
      const hasStrikeout = candidate.text.toLowerCase().includes('strikeout')
      const hasParlay = candidate.text.toLowerCase().includes('parlay')
      console.log(`${candidate.name} (${candidate.length} chars, strikeout: ${hasStrikeout}, parlay: ${hasParlay}): ${preview}...`)
    })
    console.log('')
    
    return bestCandidate.text
    
  } catch (error) {
    console.error('Google Vision API error:', error)
    throw error
  }
}

// Mock OCR function - fallback for development
async function extractTextFromImageMock(imageBuffer: Buffer): Promise<string> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock extracted text that looks like a real betslip
  return `
    DraftKings Sportsbook
    
    Parlay Bet
    
    Aaron Judge - Home Runs
    Over 0.5 (+110)
    
    Mookie Betts - Hits
    Over 1.5 (-120)
    
    Freddie Freeman - RBIs
    Over 0.5 (+105)
    
    Total Odds: +650
    Wager: $25.00
    To Win: $162.50
  `
}

// Main OCR function that tries Vision API first, falls back to mock
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    // Try Google Vision API first
    return await extractTextFromImageWithVision(imageBuffer)
  } catch (error) {
    console.warn('Google Vision API failed, using mock OCR:', error.message)
    // Fall back to mock for development
    return await extractTextFromImageMock(imageBuffer)
  }
}

// LLM-powered betslip parser
async function parseWithLLM(ocrText: string): Promise<BetSelection[]> {
  try {
    const prompt = `You are an expert sports betting slip parser. Extract all individual player prop bets from this OCR text from ANY sportsbook (FanDuel, DraftKings, BetMGM, Caesars, ESPN BET, Novig, etc.).

CRITICAL PARLAY PARSING RULES:
- If this is a parlay bet, DO NOT use the total parlay odds (like +3200) for individual selections
- Look for individual odds listed near each player's selection (like +450, -120, etc.)
- If a selection doesn't have individual odds listed, use "N/A" for odds
- Total parlay odds (usually large numbers like +3200, +650) should be ignored for individual selections
- Each player should have their own individual odds, not the combined parlay odds

SPORTSBOOK FORMAT VARIATIONS:
- FanDuel: "TO HIT A HOME RUN", "TO RECORD X+ HITS", "PROFIT BOOST", "Strikeouts Thrown", "Over X.5"
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
- "X+ STRIKEOUTS", "STRIKEOUTS", "K's", "SO", "Strikeouts Thrown", "OVER X.5 STRIKEOUTS" → "Strikeouts"
- "TO RECORD X+ TOTAL BASES", "X+ TOTAL BASES", "TB" → "Total_Bases"
- "TO RECORD X+ RBIS", "X+ RBIS", "RBI", "RUNS BATTED IN" → "RBIs"
- "X+ HITS + RUNS + RBIS", "HITS + RUNS + RBIS", "H+R+RBI", "HRR" → "Hits_Runs_RBIs"
- "TO SCORE A RUN", "X+ RUNS SCORED", "RUNS SCORED", "RUNS", "R" → "Runs"
- "X+ OUTS RECORDED", "OUTS RECORDED", "OUTS", "INNINGS PITCHED" → "Outs_Recorded"
- "X+ EARNED RUNS", "EARNED RUNS", "ER", "EARNED RUNS ALLOWED" → "Earned_Runs"
- "POINTS", "PTS" → "Points"
- "REBOUNDS", "REB" → "Rebounds"
- "ASSISTS", "AST" → "Assists"
- "GOALS" → "Goals"
- "SHOTS ON GOAL", "SOG" → "Shots"

GAME-LEVEL MARKETS:
- "MONEYLINE", "ML", "WIN", "TO WIN" → "Moneyline"
- "SPREAD", "POINT SPREAD", "RUN LINE", "PUCK LINE", "HANDICAP" → "Spread"  
- "TOTAL", "OVER/UNDER", "O/U", "TOTAL POINTS", "TOTAL RUNS", "TOTAL GOALS" → "Total"

CRITICAL LINE EXTRACTION RULES:
PAY CLOSE ATTENTION TO THE EXACT FORMAT IN THE BETSLIP:

1. STRIKEOUTS - SPECIAL HANDLING REQUIRED:
   a) For "X+" format (e.g., "7+", "8+", "6+"):
      - CRITICAL: Keep the EXACT whole number shown
      - "7+ strikeouts" → line: 7 (keep 7 exactly)
      - "8+ strikeouts" → line: 8 (keep 8 exactly)
      - "6+ strikeouts" → line: 6 (keep 6 exactly)
      DO NOT convert or modify the number for strikeouts!

   b) For "Over X.5" format:
      - Keep the exact decimal shown
      - "Over 6.5 strikeouts" → line: 6.5
      - "Over 7.5 strikeouts" → line: 7.5

2. ALL OTHER MARKETS - Standard Rules:
   a) "Over X.5" format (e.g., "Over 6.5", "Over 4.5"):
      - Extract the EXACT decimal number shown
      - "Over 6.5 hits" → line: 6.5
      - "Over 4.5 hits" → line: 4.5
      - "Over 1.5 hits" → line: 1.5

   b) "X+" format (e.g., "2+", "3+"):
      - For NON-STRIKEOUT markets: Convert to X-0.5
      - "2+ hits" → line: 1.5
      - "3+ total bases" → line: 2.5

3. Binary props (no number):
   - "TO HIT A HOME RUN" → line: 0.5
   - "TO HIT A DOUBLE" → line: 0.5
   - "TO RECORD A HIT" → line: 0.5

STRIKEOUT EXAMPLES (PAY SPECIAL ATTENTION):
- "7+ Strikeouts" → line: 7 (keep exact number)
- "8+ Strikeouts" → line: 8 (keep exact number)
- "Over 6.5 Strikeouts" → line: 6.5 (keep decimal)
- "Over 7.5 Strikeouts" → line: 7.5 (keep decimal)
- "6+ Jacob deGrom Strikeouts" → line: 6 (keep exact number)
- "7+ SHOTA IMANAGA STRIKEOUTS" → line: 7 (keep exact number)

NON-STRIKEOUT EXAMPLES:
- "2+ Hits" → line: 1.5 (convert to X-0.5)
- "3+ Total Bases" → line: 2.5 (convert to X-0.5)
- "Over 1.5 Hits" → line: 1.5 (keep decimal)

CRITICAL VALIDATION:
- For strikeouts, NEVER modify the number in X+ format
- For strikeouts, if you see "7+", the line MUST be 7
- For strikeouts, if you see "8+", the line MUST be 8
- Double-check all strikeout lines before returning!

TEAM NAME VARIATIONS:
- Handle abbreviations: "NYY" = "New York Yankees", "LAD" = "Los Angeles Dodgers"
- Handle @ vs "at" vs "vs" in matchups
- Extract both full team names and abbreviations

ODDS PARSING EXAMPLES:
For this text: "2 leg parlay Yainer Diaz To Hit A Home Run, Gavin Sheets To Hit A Home Run +3200 Yainer Diaz TO HIT A HOME RUN Houston Astros @ Athletics Gavin Sheets TO HIT A HOME RUN +450"
- "+3200" is the TOTAL PARLAY ODDS - ignore this for individual selections
- "+450" appears near Gavin Sheets, so that's his individual odds
- Yainer Diaz has no individual odds listed, so use "N/A"

FANDUEL SPECIFIC PARSING:
FanDuel uses two main formats for strikeouts:
1. "Over X.5" format: "Over 6.5\\nJacob deGrom Strikeouts Thrown" → line: 6.5
2. "X+" format: "6+\\nJacob deGrom Strikeouts Thrown" → line: 6

Look carefully at the text to determine which format is being used and extract the line accordingly.

PARSING STRATEGY:
1. First, identify if this is a parlay (look for "X Pick Parlay" or "X leg parlay")
2. Count how many picks are expected based on the parlay description
3. Scan through the text systematically to find each player
4. For each player, look for the line format BEFORE the player name - this is CRITICAL
   - "Over 17.5 CHRIS BASSITT OUTS RECORDED" → line: 17.5 (extract the number after "Over")
   - "6+ Jacob deGrom Strikeouts" → line: 6 (extract the number before "+")
5. Extract the exact line value based on the format rules above
6. Extract player name, market type, teams, game time
7. Verify you found the expected number of selections before returning

RULES:
1. Extract BOTH player props AND game-level bets (moneyline, spread, total)
2. For PLAYER PROPS: Extract player name in "First Last" format
3. For GAME-LEVEL BETS: Use team name instead of player name
4. Standardize market names using the mapping above
5. For odds: find odds specifically associated with each selection, ignore parlay totals
6. Parse team matchups from game info lines
7. Extract game times in original format
8. Extract line values using the EXACT format rules above - this is CRITICAL
9. Ignore single characters, team logos, or UI elements
10. Detect the sport based on context clues
11. If individual odds are not clear, use "N/A" rather than guessing
12. Handle any sportsbook format - focus on core betting information
13. CRITICAL: Extract ALL selections mentioned - both player props and game-level bets
14. MOST IMPORTANT: Pay attention to whether the line is "Over X.5" or "X+" format and extract accordingly

GAME-LEVEL BET EXAMPLES:
- "Texas Rangers -108 MONEYLINE" → player: "Texas Rangers", market: "Moneyline", line: null, odds: "-108"
- "Over 8.5 -106 TOTAL RUNS" → player: "Over", market: "Total", line: 8.5, odds: "-106"
- "Milwaukee Brewers +1.5 -166 RUN LINE" → player: "Milwaukee Brewers", market: "Spread", line: 1.5, odds: "-166"
- "Cincinnati Reds -1.5 +140 RUN LINE" → player: "Cincinnati Reds", market: "Spread", line: -1.5, odds: "+140"
- "Arizona Diamondbacks +1.5 -120 RUN LINE" → player: "Arizona Diamondbacks", market: "Spread", line: 1.5, odds: "-120"

CRITICAL SPREAD PARSING:
For spread bets, ALWAYS include the correct +/- sign in the line value:
- If the betslip shows "+1.5", extract line: 1.5 (positive)
- If the betslip shows "-1.5", extract line: -1.5 (negative)
- The sign indicates if the team is favored (-) or underdog (+)

OCR TEXT:
${ocrText}

Return a valid JSON array with this exact format:
[
  {
    "player": "Player Name",
    "sport": "Baseball",
    "market": "Strikeouts",
    "line": 6.5,
    "betType": "over",
    "odds": "N/A",
    "awayTeam": "Away Team",
    "homeTeam": "Home Team",
    "gameTime": "6:40 PM"
  },
  {
    "player": "Texas Rangers",
    "sport": "Baseball", 
    "market": "Moneyline",
    "line": null,
    "betType": "moneyline",
    "odds": "-108",
    "awayTeam": "Texas Rangers",
    "homeTeam": "Pittsburgh Pirates",
    "gameTime": "12:35 PM CT"
  },
  {
    "player": "Over",
    "sport": "Baseball",
    "market": "Total", 
    "line": 8.5,
    "betType": "over",
    "odds": "-106",
    "awayTeam": "Atlanta Braves",
    "homeTeam": "Miami Marlins", 
    "gameTime": "12:41 PM CT"
  },
  {
    "player": "Milwaukee Brewers",
    "sport": "Baseball",
    "market": "Spread",
    "line": 1.5, 
    "betType": "spread",
    "odds": "-166",
    "awayTeam": "Milwaukee Brewers",
    "homeTeam": "Minnesota Twins",
    "gameTime": "1:11 PM CT"
  },
  {
    "player": "Cincinnati Reds",
    "sport": "Baseball",
    "market": "Spread",
    "line": -1.5, 
    "betType": "spread",
    "odds": "+140",
    "awayTeam": "Cincinnati Reds",
    "homeTeam": "Arizona Diamondbacks",
    "gameTime": "2:10 PM CT"
  }
]

Return only the JSON array, no other text.`

    console.log('🤖 Sending betslip to OpenAI for parsing...')
    console.log('📝 OCR Text Preview (first 500 chars):', ocrText.substring(0, 500))
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cheap and effective
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 1500, // Increased token limit for larger responses
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    console.log('🤖 OpenAI response:', content)

    // Clean and parse the JSON response - handle markdown code blocks
    let cleanedContent = content.trim()
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    console.log('🧹 Cleaned content for parsing:', cleanedContent.substring(0, 200) + '...')

    // Parse the JSON response
    const parsedSelections = JSON.parse(cleanedContent)
    
    if (!Array.isArray(parsedSelections)) {
      throw new Error('OpenAI did not return an array')
    }

    console.log(`🎯 LLM found ${parsedSelections.length} selections`)

    // Convert to our BetSelection format with sport and market mapping
    const selections: BetSelection[] = parsedSelections.map((selection: any, index: number) => {
      // Map sport to API key
      const sportApiKey = mapSportToApiKey(selection.sport)
      
      // Map market to API key using our constants
      const marketApiKey = getMarketApiKey(sportApiKey, selection.market)
      
      // Default line values based on market if not provided
      let line = selection.line || 0.5 // Default to 0.5
      
      // Market-specific defaults if line is missing
      if (!selection.line) {
        switch (selection.market) {
          case 'Home_Runs':
          case 'Stolen_Bases':
          case 'Hits':
          case 'Doubles':
          case 'Triples':
          case 'Singles':
            line = 0.5
            break
          case 'Strikeouts':
            line = 5.5 // Common strikeout line
            break
          case 'Total_Bases':
            line = 1.5 // Common total bases line
            break
          case 'RBIs':
            line = 0.5
            break
          case 'Hits_Runs_RBIs':
            line = 2.5 // Common hits + runs + RBIs line
            break
          case 'Points':
            line = 15.5 // Common NBA points line
            break
          case 'Rebounds':
            line = 7.5 // Common rebounds line
            break
          case 'Assists':
            line = 5.5 // Common assists line
            break
          case 'Runs':
            line = 0.5 // Common runs scored line
            break
          case 'Outs_Recorded':
            line = 16.5 // Common outs recorded line (approximately 5.5 innings)
            break
          case 'Earned_Runs':
            line = 2.5 // Common earned runs line
            break
          case 'Moneyline':
            line = null // Moneyline doesn't have a line
            break
          case 'Spread':
            line = 1.5 // Common spread line
            break
          case 'Total':
            line = 8.5 // Common total runs line for baseball
            break
          default:
            line = 0.5
        }
      }

      // Determine bet type from the LLM response or OCR text analysis
      let betType: 'over' | 'under' | 'moneyline' | 'spread' = 'over' // Default to over
      
      // First, check if the LLM provided a betType
      if (selection.betType && ['over', 'under', 'moneyline', 'spread'].includes(selection.betType)) {
        betType = selection.betType
      } else {
        // Determine betType based on market
        if (selection.market === 'Moneyline') {
          betType = 'moneyline'
        } else if (selection.market === 'Spread') {
          betType = 'spread'
        } else {
          // For player props and totals, check for over/under
          const rawTextLower = ocrText.toLowerCase()
          const playerNameLower = selection.player?.toLowerCase() || ''
          
          // Look for "under" in the context of this specific player
          const playerContext = rawTextLower.includes(playerNameLower) 
            ? rawTextLower.substring(rawTextLower.indexOf(playerNameLower))
            : rawTextLower
          
          if (playerContext.includes('under') && !playerContext.includes('over')) {
            betType = 'under'
          }
        }
      }

      // For spread bets, try to determine the correct sign based on odds
      if (selection.market === 'Spread' && selection.line && selection.odds) {
        const odds = parseFloat(selection.odds.replace(/[^-\d.]/g, ''))
        // If odds are negative (favorite) but line is positive, make line negative
        // If odds are positive (underdog) but line is negative, make line positive
        if (odds < 0 && line > 0) {
          line = -Math.abs(line) // Make negative (favorite)
        } else if (odds > 0 && line < 0) {
          line = Math.abs(line) // Make positive (underdog)
        }
      }

      const betSelection: BetSelection = {
        id: `${index + 1}`,
        player: normalizePlayerNameForDisplay(selection.player),
        market: selection.market,
        line: line,
        betType: betType,
        sport: selection.sport,
        sportApiKey: sportApiKey,
        marketApiKey: marketApiKey,
        confidence: 0.9, // High confidence for LLM parsing
        rawText: `${selection.player} ${selection.market}`,
        metadata: {
          odds: selection.odds,
          awayTeam: selection.awayTeam,
          homeTeam: selection.homeTeam,
          gameTime: selection.gameTime,
        }
      }

      console.log(`📝 Selection ${index + 1}: ${betSelection.player} - ${betSelection.market} ${betSelection.line} (${betSelection.metadata?.odds}) [${betSelection.sport}/${betSelection.sportApiKey}] -> ${betSelection.marketApiKey}`)
      
      return betSelection
    })

    console.log(`✅ Successfully parsed ${selections.length} selections with LLM`)

    return selections

  } catch (error) {
    console.error('❌ LLM parsing failed:', error)
    console.error('Raw OCR text that failed:', ocrText.substring(0, 1000))
    // Return empty array instead of throwing - we can add fallback logic later
    return []
  }
}

// Helper function to map sport names to API keys
function mapSportToApiKey(sport: string): string {
  const sportMapping: Record<string, string> = {
    'Baseball': 'baseball_mlb',
    'Basketball': 'basketball_nba',
    'Hockey': 'icehockey_nhl',
    'Football': 'americanfootball_nfl',
    'College Basketball': 'basketball_ncaab',
    'College Football': 'americanfootball_ncaaf'
  }
  
  return sportMapping[sport] || 'baseball_mlb' // Default to MLB if unknown
}

// Function to fetch today's games for event matching
async function fetchTodaysGames(sport: string, date: string): Promise<Record<string, GameData>> {
  try {
    const apiKey = process.env.ODDS_API_KEY
    if (!apiKey) {
      console.warn('ODDS_API_KEY not configured')
      return {}
    }
    
    // Get games for the date (extend to next day to catch evening games in US timezones)
    const startTime = `${date}T00:00:00Z`
    const endTime = `${date}T23:59:59Z`
    
    // Also include early hours of next day to catch late games
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayStr = nextDay.toISOString().split('T')[0]
    const extendedEndTime = `${nextDayStr}T06:00:00Z` // Include games up to 6 AM next day UTC
    
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}&dateFormat=iso&commenceTimeFrom=${startTime}&commenceTimeTo=${extendedEndTime}`
    
    console.log(`🎯 Fetching games from Odds API: ${url}`)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Odds API error: ${response.status} ${response.statusText}`)
      return {}
    }
    
    const events = await response.json()
    console.log(`📅 Odds API returned ${events.length} games for ${date}`)
    
    // Convert to our GameData format and index by event_id
    const games: Record<string, GameData> = {}
    events.forEach((event: any) => {
      games[event.id] = {
        sport_key: event.sport_key,
        event_id: event.id,
        commence_time: event.commence_time,
        home_team: {
          name: event.home_team,
          abbreviation: event.home_team // API doesn't provide abbreviations in events endpoint
        },
        away_team: {
          name: event.away_team,
          abbreviation: event.away_team
        },
        status: 'scheduled' // Default status
      }
    })
    
    return games
  } catch (error) {
    console.error('Error fetching games from Odds API:', error)
    return {}
  }
}

// Helper function to normalize team names for matching
function normalizeTeamName(teamName: string): string {
  if (!teamName) return ''
  
  let normalized = teamName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    
  // Handle common MLB team abbreviations and variations
  const teamMappings: Record<string, string> = {
    // Kansas City Royals variations
    'kc royals': 'kansas city royals',
    'kansas city royals': 'kansas city royals',
    'kansas city': 'kansas city royals',
    'royals': 'kansas city royals',
    'kc': 'kansas city royals',
    
    // Chicago Cubs variations
    'chi cubs': 'chicago cubs',
    'chicago cubs': 'chicago cubs',
    'cubs': 'chicago cubs',
    'chi': 'chicago cubs',
    'chc': 'chicago cubs',
    
    // Chicago White Sox variations
    'chi white sox': 'chicago white sox',
    'chicago white sox': 'chicago white sox',
    'white sox': 'chicago white sox',
    'cws': 'chicago white sox',
    'chw': 'chicago white sox',
    
    // Texas Rangers variations
    'tex rangers': 'texas rangers',
    'tex': 'texas rangers',
    'texas': 'texas rangers',
    'rangers': 'texas rangers',
    
    // Pittsburgh Pirates variations
    'pit pirates': 'pittsburgh pirates', 
    'pit': 'pittsburgh pirates',
    'pittsburgh': 'pittsburgh pirates',
    'pirates': 'pittsburgh pirates',
    
    // Baltimore Orioles variations
    'bal orioles': 'baltimore orioles',
    'bal': 'baltimore orioles', 
    'baltimore': 'baltimore orioles',
    'orioles': 'baltimore orioles',
    
    // New York Yankees variations
    'ny yankees': 'new york yankees',
    'nyy': 'new york yankees',
    'new york yankees': 'new york yankees',
    'yankees': 'new york yankees',
    
    // New York Mets variations
    'ny mets': 'new york mets',
    'nym': 'new york mets',
    'new york mets': 'new york mets',
    'mets': 'new york mets',
    
    // Los Angeles Dodgers variations
    'la dodgers': 'los angeles dodgers',
    'lad': 'los angeles dodgers',
    'los angeles dodgers': 'los angeles dodgers',
    'dodgers': 'los angeles dodgers',
    
    // Los Angeles Angels variations
    'la angels': 'los angeles angels',
    'laa': 'los angeles angels',
    'los angeles angels': 'los angeles angels',
    'angels': 'los angeles angels',
    
    // San Francisco Giants variations
    'sf giants': 'san francisco giants',
    'san francisco giants': 'san francisco giants',
    'giants': 'san francisco giants',
    
    // Oakland Athletics variations
    'oak athletics': 'oakland athletics',
    'oakland athletics': 'oakland athletics',
    'athletics': 'oakland athletics',
    'as': 'oakland athletics',
    'oak': 'oakland athletics',
    
    // Arizona Diamondbacks variations
    'ari diamondbacks': 'arizona diamondbacks',
    'ari': 'arizona diamondbacks',
    'arizona': 'arizona diamondbacks',
    'diamondbacks': 'arizona diamondbacks',
    'dbacks': 'arizona diamondbacks',
    
    // Colorado Rockies variations
    'col rockies': 'colorado rockies',
    'col': 'colorado rockies',
    'colorado': 'colorado rockies',
    'rockies': 'colorado rockies',
    
    // Houston Astros variations
    'hou astros': 'houston astros',
    'hou': 'houston astros',
    'houston': 'houston astros',
    'astros': 'houston astros',
    
    // Milwaukee Brewers variations
    'mil brewers': 'milwaukee brewers',
    'mil': 'milwaukee brewers',
    'milwaukee': 'milwaukee brewers',
    'brewers': 'milwaukee brewers',
    
    // Minnesota Twins variations
    'min twins': 'minnesota twins',
    'min': 'minnesota twins',
    'minnesota': 'minnesota twins',
    'twins': 'minnesota twins',
    
    // Seattle Mariners variations
    'sea mariners': 'seattle mariners',
    'sea': 'seattle mariners',
    'seattle': 'seattle mariners',
    'mariners': 'seattle mariners',
    
    // Tampa Bay Rays variations
    'tb rays': 'tampa bay rays',
    'tampa bay rays': 'tampa bay rays',
    'rays': 'tampa bay rays',
    'tampa bay': 'tampa bay rays',
    
    // Boston Red Sox variations
    'bos red sox': 'boston red sox',
    'boston red sox': 'boston red sox',
    'red sox': 'boston red sox',
    'redsox': 'boston red sox',
    'bos': 'boston red sox',
    
    // Toronto Blue Jays variations
    'tor blue jays': 'toronto blue jays',
    'toronto blue jays': 'toronto blue jays',
    'blue jays': 'toronto blue jays',
    'bluejays': 'toronto blue jays',
    'tor': 'toronto blue jays',
    'jays': 'toronto blue jays',
    
    // Cleveland Guardians variations
    'cle guardians': 'cleveland guardians',
    'cleveland guardians': 'cleveland guardians',
    'guardians': 'cleveland guardians',
    'cleveland': 'cleveland guardians',
    'cle': 'cleveland guardians',
    
    // Detroit Tigers variations
    'det tigers': 'detroit tigers',
    'detroit tigers': 'detroit tigers',
    'tigers': 'detroit tigers',
    'detroit': 'detroit tigers',
    'det': 'detroit tigers',
    
    // Atlanta Braves variations
    'atl braves': 'atlanta braves',
    'atlanta braves': 'atlanta braves',
    'braves': 'atlanta braves',
    'atlanta': 'atlanta braves',
    'atl': 'atlanta braves',
    
    // Washington Nationals variations
    'was nationals': 'washington nationals',
    'washington nationals': 'washington nationals',
    'nationals': 'washington nationals',
    'washington': 'washington nationals',
    'was': 'washington nationals',
    'nats': 'washington nationals',
    
    // Philadelphia Phillies variations
    'phi phillies': 'philadelphia phillies',
    'philadelphia phillies': 'philadelphia phillies',
    'phillies': 'philadelphia phillies',
    'philadelphia': 'philadelphia phillies',
    'phi': 'philadelphia phillies',
    'phils': 'philadelphia phillies',
    
    // Miami Marlins variations
    'mia marlins': 'miami marlins',
    'miami marlins': 'miami marlins',
    'marlins': 'miami marlins',
    'miami': 'miami marlins',
    'mia': 'miami marlins',
    
    // St. Louis Cardinals variations
    'stl cardinals': 'st louis cardinals',
    'st louis cardinals': 'st louis cardinals',
    'cardinals': 'st louis cardinals',
    'st louis': 'st louis cardinals',
    'stl': 'st louis cardinals',
    'cards': 'st louis cardinals',
    
    // Cincinnati Reds variations
    'cin reds': 'cincinnati reds',
    'cincinnati reds': 'cincinnati reds',
    'reds': 'cincinnati reds',
    'cincinnati': 'cincinnati reds',
    'cin': 'cincinnati reds',
    
    // San Diego Padres variations
    'sd padres': 'san diego padres',
    'san diego padres': 'san diego padres',
    'padres': 'san diego padres',
    'san diego': 'san diego padres',
    'sd': 'san diego padres'
  }
  
  // Check if we have a direct mapping
  if (teamMappings[normalized]) {
    return teamMappings[normalized]
  }
  
  return normalized
}

// Helper function to calculate team name similarity with enhanced scoring
function calculateTeamSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeTeamName(name1)
  const norm2 = normalizeTeamName(name2)
  
  // Exact match after normalization
  if (norm1 === norm2) return 1.0
  
  // Check for exact substring matches (one contains the other)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    // Higher score if the shorter name is a significant portion of the longer
    const minLength = Math.min(norm1.length, norm2.length)
    const maxLength = Math.max(norm1.length, norm2.length)
    const ratio = minLength / maxLength
    
    // If the ratio is good (>= 0.5), give high score
    if (ratio >= 0.5) return 0.95
    return 0.8
  }
  
  // Check for partial matches with common team names/cities
  const words1 = norm1.split(' ')
  const words2 = norm2.split(' ')
  const commonWords = words1.filter(word => words2.includes(word) && word.length > 2)
  
  if (commonWords.length === 0) return 0
  
  // Enhanced scoring for specific matches
  const importantWords = [
    // Team names
    'royals', 'cubs', 'white sox', 'yankees', 'dodgers', 'giants', 'athletics', 
    'diamondbacks', 'rockies', 'astros', 'brewers', 'twins', 'mariners', 'rays',
    'red sox', 'blue jays', 'guardians', 'tigers', 'braves', 'nationals', 
    'phillies', 'marlins', 'cardinals', 'reds', 'padres', 'pirates', 'orioles',
    'angels', 'mets',
    // Cities that uniquely identify teams
    'kansas city', 'chicago', 'new york', 'los angeles', 'san francisco',
    'oakland', 'arizona', 'colorado', 'houston', 'milwaukee', 'minnesota',
    'seattle', 'tampa bay', 'boston', 'toronto', 'cleveland', 'detroit',
    'atlanta', 'washington', 'philadelphia', 'miami', 'cincinnati', 'san diego',
    'pittsburgh', 'baltimore', 'texas', 'st louis'
  ]
  
  // Check if we have important word matches
  const hasImportantMatch = commonWords.some(word => 
    importantWords.some(important => important.includes(word) || word.includes(important))
  )
  
  if (hasImportantMatch) {
    // High score for important word matches
    return 0.9
  }
  
  // Regular partial match scoring
  return commonWords.length / Math.max(words1.length, words2.length)
}

// Helper function to find matching game
function findMatchingGame(games: Record<string, GameData>, awayTeam?: string, homeTeam?: string): GameData | null {
  if (!awayTeam || !homeTeam) {
    console.log(`❌ Missing team data: away="${awayTeam}", home="${homeTeam}"`)
    return null
  }
  
  console.log(`🔍 Looking for game: "${awayTeam}" @ "${homeTeam}"`)
  console.log(`📊 Normalizing teams: "${awayTeam}" -> "${normalizeTeamName(awayTeam)}", "${homeTeam}" -> "${normalizeTeamName(homeTeam)}"`)
  
  let bestMatch: { game: GameData; score: number; config: string } | null = null
  
  for (const [gameId, game] of Object.entries(games)) {
    // Try both orientations: parsed (away @ home) and flipped (home @ away)
    const configs = [
      {
        name: 'normal',
        awayScore: calculateTeamSimilarity(awayTeam, game.away_team.name),
        homeScore: calculateTeamSimilarity(homeTeam, game.home_team.name)
      },
      {
        name: 'flipped',
        awayScore: calculateTeamSimilarity(awayTeam, game.home_team.name),
        homeScore: calculateTeamSimilarity(homeTeam, game.away_team.name)
      }
    ]
    
    for (const config of configs) {
      const score = (config.awayScore + config.homeScore) / 2
      
      console.log(`   🎯 ${config.name}: "${game.away_team.name}" vs "${game.home_team.name}" = ${score.toFixed(2)} (away: ${config.awayScore.toFixed(2)}, home: ${config.homeScore.toFixed(2)})`)
      
      // Lowered threshold from 0.6 to 0.5 for better matching
      if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { game, score, config: config.name }
        console.log(`      ⭐ New best match! Score: ${score.toFixed(2)}`)
      }
    }
  }
  
  if (bestMatch) {
    console.log(`✅ Best match (${bestMatch.config}): ${bestMatch.game.away_team.name} @ ${bestMatch.game.home_team.name} (score: ${bestMatch.score.toFixed(2)})`)
    return bestMatch.game
  }
  
  console.log(`❌ No suitable game match found (all scores below 0.5 threshold)`)
  console.log(`📝 Available games: ${Object.values(games).map(g => `${g.away_team.name} @ ${g.home_team.name}`).join(', ')}`)
  return null
}

// Function to map sport names to API keys
function getSportApiKey(sport: string): string {
  return mapSportToApiKey(sport)
}

// Enhanced parsing function that returns proper structure
async function parseWithLLMEnhanced(text: string): Promise<{
  success: boolean
  data?: {
    sportsbook: string
    selections: BetSelection[]
    confidence: number
  }
  error?: string
}> {
  try {
    const selections = await parseWithLLM(text)
    
    if (selections.length === 0) {
      return {
        success: false,
        error: 'No selections found in betslip'
      }
    }

    // Enhanced sportsbook detection with more identifiers
    let sportsbook = 'Unknown'
    const lowerText = text.toLowerCase()
    
    // FanDuel identifiers
    if (lowerText.includes('profit boost') || 
        lowerText.includes('to hit') || 
        lowerText.includes('to record') ||
        lowerText.includes('fanduel') ||
        lowerText.includes('fan duel')) {
      sportsbook = 'FanDuel'
    }
    // DraftKings identifiers  
    else if (lowerText.includes('draftkings') || 
             lowerText.includes('draft kings') ||
             lowerText.includes('sgp') || 
             lowerText.includes('same game parlay') ||
             lowerText.includes('dk')) {
      sportsbook = 'DraftKings'
    }
    // BetMGM identifiers
    else if (lowerText.includes('betmgm') || 
             lowerText.includes('bet mgm') ||
             lowerText.includes('mgm')) {
      sportsbook = 'BetMGM'
    }
    // Caesars identifiers
    else if (lowerText.includes('caesars') || 
             lowerText.includes('caesar') ||
             lowerText.includes('williamhill') ||
             lowerText.includes('william hill')) {
      sportsbook = 'Caesars'
    }
    // ESPN BET identifiers
    else if (lowerText.includes('espn bet') || 
             lowerText.includes('espnbet') ||
             lowerText.includes('espn')) {
      sportsbook = 'ESPN BET'
    }
    // Hard Rock Bet identifiers
    else if (lowerText.includes('hard rock') || 
             lowerText.includes('hardrockbet') ||
             lowerText.includes('hardrock')) {
      sportsbook = 'Hard Rock Bet'
    }
    // Fanatics identifiers
    else if (lowerText.includes('fanatics')) {
      sportsbook = 'Fanatics'
    }
    // BetRivers identifiers
    else if (lowerText.includes('betrivers') || 
             lowerText.includes('bet rivers') ||
             lowerText.includes('rivers')) {
      sportsbook = 'BetRivers'
    }
    // Pinnacle identifiers
    else if (lowerText.includes('pinnacle')) {
      sportsbook = 'Pinnacle'
    }
    // Legacy sportsbooks
    else if (lowerText.includes('pointsbet') || 
             lowerText.includes('points bet')) {
      sportsbook = 'PointsBet'
    }
    else if (lowerText.includes('barstool')) {
      sportsbook = 'Barstool'
    }
    else if (lowerText.includes('wynn') || 
             lowerText.includes('wynnbet')) {
      sportsbook = 'WynnBET'
    }
    else if (lowerText.includes('unibet')) {
      sportsbook = 'Unibet'
    }
    else if (lowerText.includes('bet365')) {
      sportsbook = 'bet365'
    }

    console.log(`🏢 Detected sportsbook: ${sportsbook}`)

    const averageConfidence = selections.reduce((sum, s) => sum + s.confidence, 0) / selections.length

    return {
      success: true,
      data: {
        sportsbook,
        selections,
        confidence: averageConfidence
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

// Function to save betslip to database
async function saveBetslipToDatabase(
  userId: string,
  imageUrl: string,
  sportsbook: string,
  selections: (BetSelection & { currentOdds?: any })[],
  rawOcrText: string,
  llmResponse: any,
  scanConfidence: number,
  oddsWereFetched: boolean,
  hitRatesData?: Record<string, any>
) {
  const supabase = createClient()
  
  try {
    // Generate a default title for the scanned betslip
    const defaultTitle = `${sportsbook} Betslip (${selections.length} pick${selections.length !== 1 ? 's' : ''})`

    // Insert the main betslip record
    const { data: betslip, error: betslipError } = await supabase
      .from('scanned_betslips')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        sportsbook: sportsbook,
        title: defaultTitle,
        total_selections: selections.length,
        scan_confidence: scanConfidence,
        raw_ocr_text: rawOcrText,
        llm_response: llmResponse,
        status: 'active',
        is_public: true, // Default to public for scanned betslips
        last_odds_refresh: oddsWereFetched ? new Date().toISOString() : null, // Set if we fetched odds
        hit_rates_data: hitRatesData || {}
      })
      .select()
      .single()

    if (betslipError) {
      console.error('Error saving betslip:', betslipError)
      throw betslipError
    }

    console.log(`💾 Saved betslip ${betslip.id} to database`)

    // Insert all selections
    const selectionsToInsert = selections.map(selection => ({
      scanned_betslip_id: betslip.id,
      sport: selection.sport,
      sport_api_key: selection.sportApiKey,
      event_id: selection.gameId,
      player_name: selection.player,
      market: selection.market,
      market_api_key: selection.marketApiKey,
      line: selection.line,
      bet_type: selection.betType,
      away_team: selection.metadata?.awayTeam,
      home_team: selection.metadata?.homeTeam,
      game_time: selection.metadata?.gameTime,
      original_odds: selection.metadata?.odds,
      current_odds: selection.currentOdds || {}, // Store the fetched odds
      confidence: selection.confidence,
      raw_text: selection.rawText
    }))

    const { error: selectionsError } = await supabase
      .from('scanned_betslip_selections')
      .insert(selectionsToInsert)

    if (selectionsError) {
      console.error('Error saving selections:', selectionsError)
      throw selectionsError
    }

    console.log(`✅ Saved betslip ${betslip.id} with ${selections.length} selections (including odds) to database`)
    return betslip.id
    
  } catch (error) {
    console.error('Database save error:', error)
    throw error
  }
}

// Function to fix common OCR mistakes in player names
function fixOcrMistakes(name: string): string {
  // Common OCR mistakes in player names
  const ocrFixes: Record<string, string> = {
    'lan': 'ian',    // Common mistake with capital I
    'lvan': 'ivan',  // Another common I mistake
    'lonathan': 'jonathan', // Another I case
    'lames': 'james',  // Another I case
    'lulio': 'julio',  // Another I case
    'luan': 'juan',    // Another I case
    'lasper': 'jasper', // J mistaken for I
    'losh': 'josh',    // J mistaken for I
    'lustin': 'justin', // J mistaken for I
    'lordan': 'jordan', // J mistaken for I
    'lose': 'jose',    // J mistaken for I
    'loey': 'joey',    // J mistaken for I
    'lavier': 'javier', // J mistaken for I
    'lj': 'jj',        // Common for JJ players
    'rj': 'rj',        // Keep RJ as is
    'tj': 'tj',        // Keep TJ as is
    'dj': 'dj',        // Keep DJ as is
    'aj': 'aj',        // Keep AJ as is
    'cj': 'cj'         // Keep CJ as is
  }

  // Split name into parts to handle first/last names separately
  const parts = name.toLowerCase().split(' ')
  
  // Fix each part if it matches a known OCR mistake
  const fixedParts = parts.map(part => {
    // Check if this part matches any known OCR mistakes
    const fixed = ocrFixes[part]
    if (fixed) {
      console.log(`🔧 OCR Fix: "${part}" -> "${fixed}"`)
      return fixed
    }
    return part
  })

  return fixedParts.join(' ')
}

// Enhanced player name matching with fuzzy logic (copied from refresh endpoint)
function normalizePlayerName(name: string): string {
  // First fix any OCR mistakes
  const fixedName = fixOcrMistakes(name)
  
  return fixedName
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[.,-]/g, '')  // Remove dots, commas, hyphens
    .replace(/\s+/g, ' ')
    .trim()
}

// Helper function to normalize player names for display (preserve hyphens but fix spacing)
function normalizePlayerNameForDisplay(name: string): string {
  if (!name) return name
  
  return name
    .trim()
    // Remove extra spaces around hyphens: "Pete Crow - Armstrong" → "Pete Crow-Armstrong"
    .replace(/\s*-\s*/g, '-')
    // Remove extra spaces around periods: "Jr . " → "Jr."
    .replace(/\s*\.\s*/g, '. ')
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    .trim()
}

function extractPlayerNameVariations(playerName: string): string[] {
  const normalized = normalizePlayerName(playerName)
  const variations = [normalized]
  
  // Add version without suffix
  const withoutSuffix = removeSuffixesFromName(normalized)
  if (withoutSuffix !== normalized) {
    variations.push(withoutSuffix)
  }
  
  // Add common suffix variations if the name doesn't already have one
  const commonSuffixes = ['jr', 'sr', 'ii', 'iii']
  
  // Check if name has existing suffix (handle periods)
  const normalizedLower = normalized.toLowerCase()
  const hasExistingSuffix = commonSuffixes.some(suffix => 
    normalizedLower.endsWith(` ${suffix}`) || normalizedLower.endsWith(` ${suffix}.`)
  )
  
  if (!hasExistingSuffix) {
    // Add Jr. variation for names without suffixes
    variations.push(`${normalized} jr`)
    variations.push(`${normalized} jr.`)
    variations.push(`${normalized} sr`)
    variations.push(`${normalized} sr.`)
  } else {
    // If it has a suffix, also add versions with/without periods
    const words = normalized.split(' ')
    if (words.length >= 2) {
      const lastWord = words[words.length - 1].toLowerCase()
      const baseName = words.slice(0, -1).join(' ')
      
      // Add variations with and without periods
      if (lastWord.endsWith('.')) {
        variations.push(`${baseName} ${lastWord.replace('.', '')}`)
      } else {
        variations.push(`${baseName} ${lastWord}.`)
      }
    }
  }
  
  // Split by spaces to handle "First Last" cases
  const parts = normalized.split(' ')
  
  if (parts.length >= 2) {
    // Add "Last, First" format
    variations.push(`${parts[parts.length - 1]} ${parts[0]}`)
    
    // Add "F. Last" format (first initial)
    variations.push(`${parts[0][0]} ${parts[parts.length - 1]}`)
    
    // Add "First L." format (last initial)
    variations.push(`${parts[0]} ${parts[parts.length - 1][0]}`)
    
    // NOTE: Removed individual first/last name matching as it's too permissive
    // This was causing "Kyle" to match both "Kyle Schwarber" and "Kyle Stowers"
  }
  
  // Remove duplicates and return
  return Array.from(new Set(variations))
}

// Function to calculate name similarity with fuzzy matching
function calculateNameSimilarity(target: string, candidate: string): number {
  if (!target || !candidate) return 0.0
  
  const targetNorm = target.toLowerCase().trim()
  const candidateNorm = candidate.toLowerCase().trim()
  
  // Exact match
  if (targetNorm === candidateNorm) {
    return 1.0
  }
  
  // Try matching with suffixes removed from both sides
  const targetNoSuffix = removeSuffixesFromName(targetNorm)
  const candidateNoSuffix = removeSuffixesFromName(candidateNorm)
  
  // Check if they match after removing suffixes from both
  if (targetNoSuffix === candidateNoSuffix) {
    return 0.95 // Very high confidence for match with suffix difference
  }
  
  // Check if target (without suffix) matches candidate (with suffix)
  // e.g., "Lourdes Gurriel" vs "Lourdes Gurriel Jr."
  if (targetNoSuffix === candidateNorm || targetNorm === candidateNoSuffix) {
    return 0.95 // Very high confidence for one-way suffix match
  }
  
  // Check if all words in target are in candidate (and vice versa)
  const targetWords = targetNoSuffix.split(' ')
  const candidateWords = candidateNoSuffix.split(' ')
  
  // For player names, we want both first and last name to match reasonably well
  if (targetWords.length >= 2 && candidateWords.length >= 2) {
    // Both names should have matching first and last names
    const firstNameMatch = targetWords[0] === candidateWords[0] || 
                          targetWords[0].startsWith(candidateWords[0][0]) ||
                          candidateWords[0].startsWith(targetWords[0][0])
    
    const lastNameMatch = targetWords[targetWords.length - 1] === candidateWords[candidateWords.length - 1]
    
    if (firstNameMatch && lastNameMatch) {
      return 0.9 // High confidence for first+last match
    }
    
    if (lastNameMatch && targetWords[0][0] === candidateWords[0][0]) {
      return 0.8 // Good confidence for last name + first initial
    }
  }
  
  // Check if one name contains the other (less preferred)
  if (targetNorm.includes(candidateNorm) || candidateNorm.includes(targetNorm)) {
    return 0.6 // Lower confidence for partial matches
  }
  
  return 0.0 // No match
}

function findPlayerInOutcomes(playerName: string, outcomes: Outcome[]): Outcome[] {
  const playerVariations = extractPlayerNameVariations(playerName)
  const candidateMatches: { outcome: Outcome; score: number }[] = []
  
  // Debug logging for name variations
  console.log(`🔍 Searching for player "${playerName}"`)
  console.log(`📝 Name variations: ${playerVariations.join(', ')}`)
  console.log(`📋 Available outcomes: ${outcomes.map(o => o.description).join(', ')}`)
  
  for (const outcome of outcomes) {
    if (!outcome.description) continue
    
    // Calculate similarity scores for all variations
    let bestScore = 0
    let bestVariation = ''
    for (const variation of playerVariations) {
      const score = calculateNameSimilarity(variation, outcome.description)
      if (score > bestScore) {
        bestScore = score
        bestVariation = variation
      }
    }
    
    // Also try the original player name directly
    const directScore = calculateNameSimilarity(playerName, outcome.description)
    if (directScore > bestScore) {
      bestScore = directScore
      bestVariation = playerName + ' (original)'
    }
    
    // Log detailed matching for debugging
    if (bestScore > 0.5) { // Show matches above 50% for debugging
      console.log(`  🎯 "${outcome.description}" scored ${(bestScore * 100).toFixed(1)}% (best variation: "${bestVariation}")`)
    }
    
    // Only consider matches with a reasonable similarity score
    if (bestScore >= 0.7) { // Require at least 70% confidence
      candidateMatches.push({ outcome, score: bestScore })
    }
  }
  
  // Sort by confidence score (highest first) and return outcomes
  candidateMatches.sort((a, b) => b.score - a.score)
  
  // Log the matching process for debugging
  if (candidateMatches.length > 0) {
    console.log(`🎯 Player "${playerName}" matches:`)
    candidateMatches.forEach((match, i) => {
      console.log(`  ${i + 1}. "${match.outcome.description}" (confidence: ${(match.score * 100).toFixed(1)}%)`)
    })
    
    // Only return the best match(es) if they're significantly better than others
    const bestScore = candidateMatches[0].score
    const topMatches = candidateMatches.filter(m => m.score >= bestScore - 0.1) // Within 10% of best
    
    // If we have multiple perfect matches (like different lines for same player), return all of them
    if (bestScore >= 0.9 && topMatches.length > 1) {
      console.log(`✅ Returning ${topMatches.length} high-confidence matches for line searching`)
      return topMatches.map(m => m.outcome)
    }
    // If we have one clear best match or ambiguous matches
    else if (topMatches.length === 1 || bestScore >= 0.9) {
      // Return only the best match if it's clearly the best or very confident
      return [candidateMatches[0].outcome]
    } else {
      // Return top matches if there's ambiguity
      return topMatches.map(m => m.outcome)
    }
  }
  
  console.log(`❌ No confident matches found for player "${playerName}"`)
  return []
}

// Special function to handle game-level market matching
function findGameLevelOutcome(
  selection: BetSelection,
  outcomes: Outcome[]
): Outcome | null {
  console.log(`🎮 Game-level matching for ${selection.market}: ${selection.player} ${selection.betType} ${selection.line}`)
  console.log(`📋 Available outcomes: ${outcomes.map(o => `${o.name} ${o.point} @ ${o.price}`).join(', ')}`)
  
  if (selection.market === 'Moneyline') {
    // For moneyline, match the team name
    const teamName = selection.player
    for (const outcome of outcomes) {
      if (outcome.name === teamName) {
        console.log(`✅ Moneyline match: ${outcome.name} @ ${outcome.price}`)
        return outcome
      }
    }
    
    // Try fuzzy matching for team names
    for (const outcome of outcomes) {
      const similarity = calculateTeamSimilarity(teamName || '', outcome.name)
      if (similarity > 0.8) {
        console.log(`✅ Moneyline fuzzy match: ${outcome.name} @ ${outcome.price} (similarity: ${similarity})`)
        return outcome
      }
    }
  }
  
  else if (selection.market === 'Total') {
    // For totals, match Over/Under with the correct point value
    const targetName = selection.betType === 'over' ? 'Over' : 'Under'
    const targetLine = selection.line
    
    for (const outcome of outcomes) {
      if (outcome.name === targetName && outcome.point === targetLine) {
        console.log(`✅ Total match: ${outcome.name} ${outcome.point} @ ${outcome.price}`)
        return outcome
      }
    }
  }
  
  else if (selection.market === 'Spread') {
    // For spreads, match the team name with the correct point value
    const teamName = selection.player
    const targetLine = selection.line
    
    for (const outcome of outcomes) {
      // Check if team name matches and point matches (could be positive or negative)
      if ((outcome.name === teamName || calculateTeamSimilarity(teamName || '', outcome.name) > 0.8) && 
          Math.abs(outcome.point || 0) === Math.abs(targetLine || 0)) {
        console.log(`✅ Spread match: ${outcome.name} ${outcome.point} @ ${outcome.price}`)
        return outcome
      }
    }
  }
  
  console.log(`❌ No game-level match found for ${selection.market}`)
  return null
}

function findMatchingOutcome(
  playerName: string, 
  line: number, 
  betType: string, 
  outcomes: Outcome[]
): Outcome | null {
  // Use the enhanced version with empty market keys for backward compatibility
  return findMatchingOutcomeWithMarket(playerName, line, betType, outcomes, [])
}

// Enhanced function that includes market context for strikeout detection
function findMatchingOutcomeWithMarket(
  playerName: string, 
  line: number, 
  betType: string, 
  outcomes: Outcome[],
  marketKeys: string[]
): Outcome | null {
  const playerOutcomes = findPlayerInOutcomes(playerName, outcomes)
  
  if (playerOutcomes.length === 0) {
    return null
  }
  
  console.log(`🔍 Found ${playerOutcomes.length} player outcome(s) for "${playerName}"`)
  console.log(`🎯 Looking for: ${betType} ${line}`)
  console.log(`📋 Available outcomes: ${playerOutcomes.map(o => `${o.description} ${o.name} ${o.point}`).join(', ')}`)
  
  // Find outcome with matching line and bet type
  const targetName = betType.toLowerCase() === 'over' ? 'Over' : 'Under'
  
  // First try exact match
  for (const outcome of playerOutcomes) {
    if (outcome.name === targetName && outcome.point === line) {
      console.log(`✅ Exact match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
      return outcome
    }
  }
  
  // Check if this is a strikeout market based on the market keys
  const isStrikeoutMarket = marketKeys.some(key => 
    key.includes('pitcher_strikeouts') || 
    key.includes('strikeout')
  )
  
  console.log(`🎯 Strikeout market detected: ${isStrikeoutMarket} (markets: ${marketKeys.join(', ')})`)
  if (isStrikeoutMarket) {
    console.log(`📊 Strikeout outcomes found: ${playerOutcomes.map(o => `${o.description} ${o.name} ${o.point}`).join(', ')}`)
  }
  
  if (isStrikeoutMarket) {
    // If we have a whole number (6), try -0.5 (5.5) because "6+" means "Over 5.5"
    if (Number.isInteger(line)) {
      const convertedLine = line - 0.5
      console.log(`🎯 Strikeout market detected - trying line conversion: ${line}+ -> Over ${convertedLine}`)
      for (const outcome of playerOutcomes) {
        if (outcome.name === targetName && outcome.point === convertedLine) {
          console.log(`✅ Strikeout conversion match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
          return outcome
        }
      }
      
      // Also try the exact line in case the API uses whole numbers
      console.log(`🎯 Strikeout market - also trying exact line: ${line}`)
      for (const outcome of playerOutcomes) {
        if (outcome.name === targetName && outcome.point === line) {
          console.log(`✅ Strikeout exact match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
          return outcome
        }
      }
    }
    // If we have a half number (5.5), try +0.5 (6) because API "Over 5.5" = sportsbook "6+"
    else if (line % 1 === 0.5) {
      const convertedLine = line + 0.5
      console.log(`🎯 Strikeout market detected - trying line conversion: Over ${line} -> ${convertedLine}+`)
      for (const outcome of playerOutcomes) {
        if (outcome.name === targetName && outcome.point === convertedLine) {
          console.log(`✅ Strikeout reverse conversion match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
          return outcome
        }
      }
      
      // Also try the exact line
      console.log(`🎯 Strikeout market - also trying exact line: ${line}`)
      for (const outcome of playerOutcomes) {
        if (outcome.name === targetName && outcome.point === line) {
          console.log(`✅ Strikeout exact match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
          return outcome
        }
      }
    }
  }
  
  // STRICT MATCHING: If exact line not found, do NOT use fuzzy matching
  // This prevents comparing different lines (e.g., 2+ vs 2.5+ vs 3+ total bases)
  console.log(`❌ No exact match found for "${playerName}" ${betType} ${line} - excluding this sportsbook from comparison`)
  console.log(`📋 Available lines for this player: ${playerOutcomes.map(o => `${o.name} ${o.point}`).join(', ')}`)
  return null
}

// Fetch odds for a specific selection
async function fetchOddsForSelection(
  selection: BetSelection,
  apiKey: string,
  activeSportsbooks: string[]
): Promise<any> {
  if (!selection.gameId) {
    return {
      error: 'No event ID available',
      metadata: {
        matches_found: 0,
        total_bookmakers: 0,
        best_odds: null,
        best_book: null,
        player_searched: selection.player || '',
        line_searched: selection.line || 0,
        bet_type_searched: selection.betType,
        market_searched: selection.marketApiKey,
        last_updated: new Date().toISOString(),
        error: 'No event ID available'
      }
    }
  }

  try {
    console.log(`🎯 Fetching odds for: ${selection.player} - ${selection.market} ${selection.betType} ${selection.line}`)
    
    // Determine which markets to fetch (standard + alternate if available)
    const marketsToFetch = [selection.marketApiKey]
    
    // Check if this market has alternates and add them
    const marketConfig: SportMarket | undefined = getMarketsForSport(selection.sportApiKey).find(m => m.value === selection.market)
    if (marketConfig?.hasAlternates && marketConfig.alternateKey) {
      marketsToFetch.push(marketConfig.alternateKey)
      console.log(`📊 Including alternate market: ${marketConfig.alternateKey}`)
    }
    
    // Build API URL with all active sportsbooks and markets
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${selection.sportApiKey}/events/${selection.gameId}/odds`
    const params = new URLSearchParams({
      apiKey,
      regions: 'us',
      markets: marketsToFetch.join(','), // Fetch both standard and alternate markets
      oddsFormat: 'american',
      bookmakers: activeSportsbooks.join(','),
      includeSids: 'true',
      includeLinks: 'true'
    })

    console.log(`📞 API Call: ${oddsUrl}?${params.toString()}`)
    console.log(`📊 Fetching markets: ${marketsToFetch.join(', ')}`)
    
    // Small additional delay to prevent rate limiting on rapid requests
    await new Promise(resolve => setTimeout(resolve, 100))
    
    let oddsResponse = await fetch(`${oddsUrl}?${params.toString()}`)

    // Handle 429 rate limit errors with retry logic
    if (oddsResponse.status === 429) {
      console.warn(`⚠️ Rate limit hit for ${selection.player}, waiting 2 seconds and retrying...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      oddsResponse = await fetch(`${oddsUrl}?${params.toString()}`)
      
      // If still rate limited after retry, wait longer and try once more
      if (oddsResponse.status === 429) {
        console.warn(`⚠️ Rate limit hit again for ${selection.player}, waiting 5 seconds and final retry...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        oddsResponse = await fetch(`${oddsUrl}?${params.toString()}`)
      }
    }

    if (!oddsResponse.ok) {
      const errorMessage = oddsResponse.status === 429 
        ? `Rate limit exceeded after retries: ${oddsResponse.status}`
        : `API error: ${oddsResponse.status}`
      
      console.error(`❌ Failed to fetch odds for ${selection.gameId}: ${errorMessage}`)
      return {
        error: errorMessage,
        metadata: {
          matches_found: 0,
          total_bookmakers: 0,
          best_odds: null,
          best_book: null,
          player_searched: selection.player || '',
          line_searched: selection.line || 0,
          bet_type_searched: selection.betType,
          market_searched: selection.marketApiKey,
          last_updated: new Date().toISOString(),
          error: errorMessage
        }
      }
    }

    const oddsData: OddsResponse = await oddsResponse.json()
    console.log(`✅ Fetched odds data with ${oddsData.bookmakers?.length || 0} bookmakers`)

    if (!oddsData.bookmakers || oddsData.bookmakers.length === 0) {
      console.log(`⚠️ No bookmakers data for ${selection.player}`)
      return {
        error: 'No bookmakers available',
        metadata: {
          matches_found: 0,
          total_bookmakers: 0,
          best_odds: null,
          best_book: null,
          player_searched: selection.player || '',
          line_searched: selection.line || 0,
          bet_type_searched: selection.betType,
          market_searched: selection.marketApiKey,
          last_updated: new Date().toISOString(),
          error: 'No bookmakers available'
        }
      }
    }

    // Find odds across all sportsbooks and markets
    const allBookmakerOdds: Record<string, any> = {}
    let bestOdds: number | null = null
    let bestBook: string | null = null
    let foundMatches = 0

    for (const bookmaker of oddsData.bookmakers) {
      // Look for the player across ALL markets (standard + alternate)
      const allOutcomes: Outcome[] = []
      
      for (const marketKey of marketsToFetch) {
        const market = bookmaker.markets.find(m => m.key === marketKey)
        if (market) {
          console.log(`📊 Found market ${marketKey} for ${bookmaker.key} with ${market.outcomes?.length || 0} outcomes`)
          allOutcomes.push(...(market.outcomes || []))
        } else {
          console.log(`⚠️ Market ${marketKey} not found for ${bookmaker.key}`)
        }
      }

      if (allOutcomes.length === 0) {
        console.log(`⚠️ No markets found for ${bookmaker.key}`)
        continue
      }

      // Find the specific player + line + bet type across all outcomes
      // Check if this is a game-level market
      const gameLevelMarkets = ['Moneyline', 'Spread', 'Total']
      let matchingOutcome: Outcome | null = null
      
      if (gameLevelMarkets.includes(selection.market)) {
        // Use game-level matching for moneyline, spread, total
        matchingOutcome = findGameLevelOutcome(selection, allOutcomes)
      } else {
        // Use player prop matching for all other markets
        // Pass the market info for strikeout detection
        matchingOutcome = findMatchingOutcomeWithMarket(
          selection.player || '',
          selection.line || 0,
          selection.betType,
          allOutcomes,
          marketsToFetch // Pass market keys for strikeout detection
        )
      }

      if (matchingOutcome) {
        foundMatches++
        console.log(`✅ Found match for ${selection.player} at ${bookmaker.key}: ${matchingOutcome.name} ${matchingOutcome.point} @ ${matchingOutcome.price}`)
        
        allBookmakerOdds[bookmaker.key] = {
          price: matchingOutcome.price,
          point: matchingOutcome.point,
          link: matchingOutcome.link || null,
          sid: matchingOutcome.sid || null,
          last_update: bookmaker.last_update
        }

        // Track best odds (highest for positive, closest to 0 for negative)
        if (bestOdds === null || 
            (matchingOutcome.price > 0 && matchingOutcome.price > bestOdds) ||
            (matchingOutcome.price < 0 && bestOdds < 0 && matchingOutcome.price > bestOdds)) {
          bestOdds = matchingOutcome.price
          bestBook = bookmaker.key
        }
      } else {
        console.log(`❌ No match found for ${selection.player} ${selection.betType} ${selection.line} at ${bookmaker.key}`)
      }
    }

    // Create comprehensive odds object
    const currentOdds = {
      bookmakers: allBookmakerOdds,
      metadata: {
        matches_found: foundMatches,
        total_bookmakers: oddsData.bookmakers.length,
        best_odds: bestOdds,
        best_book: bestBook,
        player_searched: selection.player || '',
        line_searched: selection.line || 0,
        bet_type_searched: selection.betType,
        market_searched: marketsToFetch.join(','), // Include all markets searched
        last_updated: new Date().toISOString()
      } as OddsMetadata
    }

    console.log(`📊 Final odds summary for ${selection.player}: ${foundMatches}/${oddsData.bookmakers.length} matches, best: ${bestOdds} @ ${bestBook}`)
    return currentOdds

  } catch (error) {
    console.error(`❌ Error fetching odds for ${selection.player}:`, error)
    return {
      error: 'Failed to fetch odds',
      metadata: {
        matches_found: 0,
        total_bookmakers: 0,
        best_odds: null,
        best_book: null,
        player_searched: selection.player || '',
        line_searched: selection.line || 0,
        bet_type_searched: selection.betType,
        market_searched: selection.marketApiKey,
        last_updated: new Date().toISOString(),
        error: 'Failed to fetch odds'
      }
    }
  }
}

// Helper function to remove suffixes (used in both odds and hit rate matching)
function removeSuffixesFromName(name: string): string {
  const suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'v']
  const words = name.split(' ')
  
  // Remove suffix if it's the last word and matches our list (allow 2+ words for flexibility)
  if (words.length >= 2) {
    const lastWord = words[words.length - 1].toLowerCase().replace(/\./g, '') // Remove periods
    if (suffixes.includes(lastWord)) {
      return words.slice(0, -1).join(' ')
    }
  }
  
  return name
}



// Helper function to fetch hit rates for all selections
async function fetchHitRatesForSelections(selections: BetSelection[]): Promise<Record<string, any>> {
  try {
    const hitRatesData: Record<string, any> = {}
    
    // Define game-level markets that don't need hit rate lookups
    const gameLevelMarkets = ['Moneyline', 'Spread', 'Total']
    
    // Filter out game-level markets to skip hit rate lookups
    const playerPropSelections = selections.filter(selection => 
      !gameLevelMarkets.includes(selection.market)
    )
    
    console.log(`📊 Filtering selections: ${selections.length} total, ${playerPropSelections.length} player props, ${selections.length - playerPropSelections.length} game-level (skipping hit rates)`)
    
    for (const selection of playerPropSelections) {
      if (!selection.player) continue
      
      try {
        // Create player name variations including suffix removal
        const playerNameVariations = [
          selection.player, // Original name
          removeSuffixesFromName(selection.player.toLowerCase()), // Remove suffixes
          selection.player.toLowerCase(), // Just lowercase
        ]
        
        // Remove duplicates
        const uniquePlayerNames = Array.from(new Set(playerNameVariations))
        
        // Try multiple market name variations to handle mismatches between LLM parsing, database names, and our mapping
        // ONLY format variations of the SAME market - no fallbacks to different markets
        const marketVariations = [
          selection.market, // Original parsed market (e.g., "Home_Runs")
          selection.market.replace(/_/g, ' '), // Replace underscores with spaces (e.g., "Home Runs")
          selection.market.replace(/\s+/g, '_'), // Replace spaces with underscores 
          selection.market.toLowerCase(), // lowercase version
          selection.market.toUpperCase(), // uppercase version
          selection.market.toLowerCase().replace(/_/g, ' '), // lowercase with spaces
          selection.market.toLowerCase().replace(/\s+/g, '_'), // lowercase with underscores
          
          // Specific database mappings for EXACT market matches only
          selection.market.replace(/Home_Runs/i, 'Home Runs'),
          selection.market.replace(/Home Runs/i, 'Home_Runs'),
          selection.market.replace(/Total_Bases/i, 'Total Bases'),
          selection.market.replace(/Total Bases/i, 'Total_Bases'),
          selection.market.replace(/Hits_Runs_RBIs/i, 'Hits + Runs + RBIs'),
          selection.market.replace(/Hits \+ Runs \+ RBIs/i, 'Hits_Runs_RBIs'),
          selection.market.replace(/Outs_Recorded/i, 'Outs'),
          selection.market.replace(/Outs/i, 'Outs_Recorded'),
          selection.market.replace(/Earned_Runs/i, 'Earned Runs'),
          selection.market.replace(/Earned Runs/i, 'Earned_Runs'),
        ]
        
        // Remove duplicates
        const uniqueMarkets = Array.from(new Set(marketVariations))
        
        let hitRateData = null
        
        // Try each player name variation with each market variation until we find a match
        for (const playerName of uniquePlayerNames) {
          if (hitRateData) break // Stop if we found data
          
          for (const marketVariation of uniqueMarkets) {
            const baseUrl = getBaseUrl()
          
          const response = await fetch(`${baseUrl}/api/player-hit-rate?playerName=${encodeURIComponent(playerName)}&market=${encodeURIComponent(marketVariation)}`)
            
            if (response.ok) {
              const responseData = await response.json()
              if (responseData.profile) {
                hitRateData = responseData.profile
                console.log(`✅ Hit rate found for "${selection.player}" using name "${playerName}" with market "${marketVariation}"`)
                break
              }
            }
          }
        }
        
        if (hitRateData) {
          hitRatesData[selection.player] = hitRateData
        } else {
          console.log(`⚠️ No hit rate data found for ${selection.player} with any name/market variation`)
        }
        
      } catch (error) {
        console.error(`❌ Error fetching hit rate for ${selection.player}:`, error)
        continue
      }
    }
    
    console.log(`📊 Hit rate data fetched for ${Object.keys(hitRatesData).length}/${playerPropSelections.length} player props (${selections.length - playerPropSelections.length} game-level markets skipped)`)
    return hitRatesData
  } catch (error) {
    console.error('❌ Error in fetchHitRatesForSelections:', error)
    return {}
  }
}

// Helper function to normalize player names for fuzzy matching
function normalizePlayerNameForTeamLookup(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Helper function to calculate string similarity (Levenshtein-based)
function calculatePlayerNameSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  
  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0
  
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null))
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  const maxLen = Math.max(len1, len2)
  return (maxLen - matrix[len1][len2]) / maxLen
}

// Helper function to create name variations for fuzzy matching (similar to hit rate API)
function createPlayerNameVariations(playerName: string): string[] {
  const variations = new Set<string>()
  
  // Original name
  variations.add(playerName)
  
  // Normalized version
  const normalized = normalizePlayerNameForTeamLookup(playerName)
  variations.add(normalized)
  
  // Without suffixes
  const withoutSuffix = removeSuffixesFromName(normalized)
  if (withoutSuffix !== normalized) {
    variations.add(withoutSuffix)
  }
  
  // First and last name only (for names with middle names/initials)
  const words = normalized.split(' ')
  if (words.length > 2) {
    variations.add(`${words[0]} ${words[words.length - 1]}`)
  }
  
  // Remove middle initials (e.g., "John A. Smith" -> "John Smith")
  const withoutInitials = normalized.replace(/\s+[a-z]\s+/g, ' ').replace(/\s+/g, ' ')
  if (withoutInitials !== normalized) {
    variations.add(withoutInitials)
  }
  
  return Array.from(variations)
}

// Enhanced function to get player team info using direct database fuzzy matching
async function getPlayerTeamInfo(playerName: string): Promise<{
  teamName: string | null
  teamAbbreviation: string | null
  confidence: number
}> {
  try {
    console.log(`🔍 Looking up team info for player: "${playerName}" using fuzzy matching`)
    
    const supabase = createClient()
    
    // First try exact match (case-insensitive)
    console.log(`[TEAM LOOKUP] Trying exact match for: "${playerName}"`)
    let { data: exactMatch, error: exactError } = await supabase
      .from('mlb_players')
      .select(`
        player_id,
        full_name,
        team_id,
        mlb_teams!inner(
          name,
          abbreviation
        )
      `)
      .ilike('full_name', playerName.trim())
      .maybeSingle()

    if (exactError) {
      console.error(`❌ Database error in exact match: ${exactError.message}`)
    }

    if (exactMatch) {
      const teamData = Array.isArray(exactMatch.mlb_teams) 
        ? exactMatch.mlb_teams[0] 
        : exactMatch.mlb_teams
      
      if (teamData) {
        console.log(`[TEAM LOOKUP] ✅ Exact match found: ${exactMatch.full_name} → ${teamData.name}`)
        return {
          teamName: teamData.name,
          teamAbbreviation: teamData.abbreviation,
          confidence: 1.0
        }
      }
    }

    // If no exact match, try fuzzy matching
    console.log(`[TEAM LOOKUP] No exact match, trying fuzzy matching...`)
    
    // Get all MLB players for fuzzy matching
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from('mlb_players')
      .select(`
        player_id,
        full_name,
        team_id,
        mlb_teams!inner(
          name,
          abbreviation
        )
      `)

    if (allPlayersError) {
      console.error(`❌ Error fetching all players: ${allPlayersError.message}`)
      return { teamName: null, teamAbbreviation: null, confidence: 0 }
    }

    if (!allPlayers || allPlayers.length === 0) {
      console.log(`[TEAM LOOKUP] No players found in database`)
      return { teamName: null, teamAbbreviation: null, confidence: 0 }
    }

    console.log(`[TEAM LOOKUP] Found ${allPlayers.length} players in database for fuzzy matching`)

    // Create variations of the search name
    const searchVariations = createPlayerNameVariations(playerName)
    console.log(`[TEAM LOOKUP] Search variations: ${searchVariations.join(', ')}`)

    let bestMatch = null
    let bestScore = 0
    const minSimilarity = 0.7 // Minimum similarity threshold

    // Try fuzzy matching against all players
    for (const player of allPlayers) {
      const dbPlayerVariations = createPlayerNameVariations(player.full_name)
      
      // Compare each search variation against each database variation
      for (const searchVar of searchVariations) {
        for (const dbVar of dbPlayerVariations) {
          const similarity = calculatePlayerNameSimilarity(searchVar, dbVar)
          
          if (similarity > bestScore && similarity >= minSimilarity) {
            bestScore = similarity
            bestMatch = player
            console.log(`[TEAM LOOKUP] New best match: "${player.full_name}" (${(similarity * 100).toFixed(1)}%) - "${searchVar}" vs "${dbVar}"`)
          }
        }
      }
    }

    if (bestMatch) {
      const teamData = Array.isArray(bestMatch.mlb_teams) 
        ? bestMatch.mlb_teams[0] 
        : bestMatch.mlb_teams
      
      if (teamData) {
        console.log(`[TEAM LOOKUP] ✅ Fuzzy match found: "${bestMatch.full_name}" → ${teamData.name} with ${(bestScore * 100).toFixed(1)}% similarity`)
        return {
          teamName: teamData.name,
          teamAbbreviation: teamData.abbreviation,
          confidence: bestScore
        }
      }
    }

    console.log(`[TEAM LOOKUP] ❌ No confident matches found for player "${playerName}" (best score: ${(bestScore * 100).toFixed(1)}%)`)
    return { teamName: null, teamAbbreviation: null, confidence: 0 }
    
  } catch (error) {
    console.error(`❌ Error looking up team info for ${playerName}:`, error)
    return { teamName: null, teamAbbreviation: null, confidence: 0 }
  }
}

// Enhanced event matching function that infers team information from players
async function enhancedFindMatchingGame(
  games: Record<string, GameData>, 
  selections: BetSelection[],
  awayTeam?: string, 
  homeTeam?: string
): Promise<{ 
  gameId: string | null
  inferredAwayTeam?: string
  inferredHomeTeam?: string
  confidence: number
}> {
  
  // If we have valid team information (not "N/A"), use the original function
  if (awayTeam && homeTeam && awayTeam !== 'N/A' && homeTeam !== 'N/A') {
    const matchedGame = findMatchingGame(games, awayTeam, homeTeam)
    return {
      gameId: matchedGame?.event_id || null,
      confidence: matchedGame ? 1.0 : 0
    }
  }
  
  console.log(`🔄 No team info provided, attempting to infer from players...`)
  
  // Filter to player props only (skip game-level markets)
  const gameLevelMarkets = ['Moneyline', 'Spread', 'Total']
  const playerSelections = selections.filter(s => 
    s.player && !gameLevelMarkets.includes(s.market)
  )
  
  if (playerSelections.length === 0) {
    console.log(`❌ No player selections available for team inference`)
    return { gameId: null, confidence: 0 }
  }
  
  console.log(`🎯 Attempting team inference from ${playerSelections.length} player selections`)
  
  // Look up team information for all players
  const teamLookupPromises = playerSelections.map(async (selection) => {
    const teamInfo = await getPlayerTeamInfo(selection.player!)
    return {
      player: selection.player!,
      teamInfo
    }
  })
  
  const teamLookupResults = await Promise.all(teamLookupPromises)
  
  // Group players by their teams
  const teamGroups: Record<string, string[]> = {}
  const teamData: Record<string, { name: string; abbreviation: string }> = {}
  
  for (const result of teamLookupResults) {
    if (result.teamInfo.teamName && result.teamInfo.confidence >= 0.7) { // Require 70% confidence
      const teamKey = result.teamInfo.teamName
      if (!teamGroups[teamKey]) {
        teamGroups[teamKey] = []
        teamData[teamKey] = {
          name: result.teamInfo.teamName,
          abbreviation: result.teamInfo.teamAbbreviation || ''
        }
      }
      teamGroups[teamKey].push(result.player)
    }
  }
  
  const teamNames = Object.keys(teamGroups)
  console.log(`📊 Found players from teams: ${teamNames.join(', ')}`)
  
  if (teamNames.length === 0) {
    console.log(`❌ No teams identified from player lookups`)
    return { gameId: null, confidence: 0 }
  }
  
  if (teamNames.length === 1) {
    // All players from same team - look for any game involving this team
    const teamName = teamNames[0]
    console.log(`🎯 All players from same team (${teamName}), looking for any game involving this team`)
    
    for (const [gameId, game] of Object.entries(games)) {
      const homeTeamMatch = calculateTeamSimilarity(teamName, game.home_team.name) > 0.8
      const awayTeamMatch = calculateTeamSimilarity(teamName, game.away_team.name) > 0.8
      
      if (homeTeamMatch || awayTeamMatch) {
        console.log(`✅ Found game: ${game.away_team.name} @ ${game.home_team.name}`)
        return {
          gameId,
          inferredAwayTeam: game.away_team.name,
          inferredHomeTeam: game.home_team.name,
          confidence: 0.85 // Good confidence for single-team inference
        }
      }
    }
  }
  
  if (teamNames.length === 2) {
    // Players from two teams - perfect match scenario
    console.log(`🎯 Players from two teams, looking for direct matchup`)
    
    const [team1, team2] = teamNames
    
    for (const [gameId, game] of Object.entries(games)) {
      // Try both orientations
      const match1 = (calculateTeamSimilarity(team1, game.away_team.name) > 0.8 && 
                      calculateTeamSimilarity(team2, game.home_team.name) > 0.8)
      const match2 = (calculateTeamSimilarity(team2, game.away_team.name) > 0.8 && 
                      calculateTeamSimilarity(team1, game.home_team.name) > 0.8)
      
      if (match1 || match2) {
        console.log(`✅ Perfect matchup found: ${game.away_team.name} @ ${game.home_team.name}`)
        return {
          gameId,
          inferredAwayTeam: game.away_team.name,
          inferredHomeTeam: game.home_team.name,
          confidence: 0.95 // Very high confidence for two-team match
        }
      }
    }
  }
  
  if (teamNames.length > 2) {
    console.log(`⚠️ Players from ${teamNames.length} teams - this might be a parlay across multiple games`)
    // For multi-team parlays, we could potentially match each player to their respective game
    // For now, we'll return no match and let individual player odds fetching handle it
    return { gameId: null, confidence: 0 }
  }
  
  console.log(`❌ Could not infer game from team information`)
  return { gameId: null, confidence: 0 }
}

export async function POST(request: NextRequest) {
  try {
    // ⚠️ AUTHENTICATION CHECK - Must be first
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Authentication failed - redirecting to sign-in')
      return NextResponse.json(
        { 
          error: 'Authentication required',
          redirectTo: '/sign-in',
          message: 'You must be signed in to use the betslip scanner'
        },
        { status: 401 }
      )
    }

    console.log(`✅ User authenticated: ${user.id}`)

    // Parse form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    console.log(`📷 Processing image: ${imageFile.name} (${imageFile.size} bytes)`)

    // Convert file to buffer for Vision API
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Extract text using existing OCR function
    console.log('🔍 Running OCR extraction...')
    const extractedText = await extractTextFromImage(imageBuffer)
    
    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No text found in image' },
        { status: 400 }
      )
    }

    console.log('📝 OCR Text extracted:', extractedText.substring(0, 200) + '...')

    // Parse with enhanced LLM function
    console.log('🤖 Parsing with LLM...')
    const llmResult = await parseWithLLMEnhanced(extractedText)
    
    if (!llmResult.success || !llmResult.data) {
      return NextResponse.json(
        { 
          error: 'Failed to parse betslip', 
          details: llmResult.error,
          rawText: extractedText 
        },
        { status: 400 }
      )
    }

    const { sportsbook, selections: parsedSelections, confidence } = llmResult.data

    console.log(`🎯 Parsed ${parsedSelections.length} selections from ${sportsbook}`)

    // Create a games cache to avoid duplicate API calls
    const gamesCache = new Map<string, Record<string, GameData>>()
    const today = new Date().toISOString().split('T')[0]

    // Helper function to get cached games
    const getCachedGames = async (sportApiKey: string, date: string): Promise<Record<string, GameData>> => {
      const cacheKey = `${sportApiKey}-${date}`
      if (!gamesCache.has(cacheKey)) {
        console.log(`🎮 Fetching games for ${sportApiKey} on ${date}`)
        const games = await fetchTodaysGames(sportApiKey, date)
        gamesCache.set(cacheKey, games)
        console.log(`🎮 Cached ${Object.keys(games).length} games for ${sportApiKey}`)
      }
      return gamesCache.get(cacheKey)!
    }

    // Process selections in parallel with event matching
    console.log(`🔄 Processing ${parsedSelections.length} selections in parallel...`)
    const processingPromises = parsedSelections.map(async (selection) => {
      try {
        console.log(`🔄 Processing: ${selection.player} - ${selection.market}`)
        
        // Get sport API key
        const sportApiKey = getSportApiKey(selection.sport)
        if (!sportApiKey) {
          console.log(`⚠️ Unsupported sport: ${selection.sport}`)
          return null
        }

        // Get market API key
        const marketApiKey = getMarketApiKey(sportApiKey, selection.market)
        if (!marketApiKey) {
          console.log(`⚠️ Unsupported market: ${selection.market}`)
          return null
        }

        // Fetch today's games for event matching (cached)
        const games = await getCachedGames(sportApiKey, today)
        
        // If team information is missing and we have a player name, try to infer team info
        let awayTeam = selection.metadata.awayTeam
        let homeTeam = selection.metadata.homeTeam
        
        // Check if team info is missing or marked as "N/A"
        const isMissingTeamInfo = (!awayTeam || !homeTeam || awayTeam === 'N/A' || homeTeam === 'N/A')
        
        if (isMissingTeamInfo && selection.player && selection.market !== 'Moneyline' && selection.market !== 'Spread' && selection.market !== 'Total') {
          console.log(`🔍 Missing team info for ${selection.player}, attempting lookup...`)
          
          const teamInfo = await getPlayerTeamInfo(selection.player)
          
          if (teamInfo.teamName && teamInfo.confidence >= 0.7) {
            console.log(`✅ Found team for ${selection.player}: ${teamInfo.teamName}`)
            
            // Look for a game involving this team
            for (const [gameId, game] of Object.entries(games)) {
              const homeTeamMatch = calculateTeamSimilarity(teamInfo.teamName, game.home_team.name) > 0.8
              const awayTeamMatch = calculateTeamSimilarity(teamInfo.teamName, game.away_team.name) > 0.8
              
              if (homeTeamMatch || awayTeamMatch) {
                awayTeam = game.away_team.name
                homeTeam = game.home_team.name
                console.log(`✅ Inferred game from player team: ${awayTeam} @ ${homeTeam}`)
                break
              }
            }
          }
        }
        
        const matchedGame = findMatchingGame(games, awayTeam, homeTeam)

        const processedSelection: BetSelection = {
          id: selection.id,
          player: selection.player,
          market: selection.market,
          line: selection.line,
          betType: selection.betType,
          sport: selection.sport,
          sportApiKey,
          marketApiKey,
          gameId: matchedGame?.event_id,
          confidence: selection.confidence,
          rawText: selection.rawText,
          metadata: {
            ...selection.metadata,
            awayTeam: awayTeam || selection.metadata.awayTeam,
            homeTeam: homeTeam || selection.metadata.homeTeam
          }
        }

        if (matchedGame) {
          console.log(`✅ Matched: ${selection.player} -> ${matchedGame.event_id}`)
        } else {
          console.log(`⚠️ No match: ${selection.player} (${selection.metadata.awayTeam} vs ${selection.metadata.homeTeam})`)
        }

        return processedSelection
        
      } catch (error) {
        console.error(`❌ Error processing selection ${selection.player}:`, error)
        return null
      }
    })

    // Wait for all processing to complete and filter out null results
    const processingResults = await Promise.all(processingPromises)
    const processedSelections = processingResults.filter((result): result is BetSelection => result !== null)
    
    console.log(`✅ Processed ${processedSelections.length}/${parsedSelections.length} selections successfully`)

    // Get API key and active sportsbooks
    const apiKey = process.env.ODDS_API_KEY
    if (!apiKey) {
      console.warn('ODDS_API_KEY not configured, skipping odds fetch')
    }

    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id)
    
    console.log(`📚 Using ${activeSportsbooks.length} active sportsbooks: ${activeSportsbooks.join(', ')}`)

    // Parallel execution of odds fetching and hit rates fetching with staggered delays
    console.log(`🚀 Starting staggered odds and hit rates fetching...`)
    
    const oddsPromises = processedSelections.map(async (selection, index) => {
      try {
        // Add staggered delay to prevent rate limiting (200ms between requests)
        const delay = index * 200 // 200ms delay between each request
        if (delay > 0) {
          console.log(`⏱️ Waiting ${delay}ms before fetching odds for ${selection.player}`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        // Skip odds fetching if no event ID (game not matched) or no API key
        if (!selection.gameId || !apiKey || activeSportsbooks.length === 0) {
          const errorReason = !selection.gameId ? 'No event ID available - game not matched' : 'No odds API configured'
          console.log(`⚠️ Skipping odds fetch for ${selection.player} - ${errorReason}`)
          
          return {
            ...selection,
            currentOdds: {
              error: errorReason,
              metadata: {
                matches_found: 0,
                total_bookmakers: 0,
                best_odds: null,
                best_book: null,
                player_searched: selection.player || '',
                line_searched: selection.line || 0,
                bet_type_searched: selection.betType,
                market_searched: selection.marketApiKey,
                last_updated: new Date().toISOString(),
                error: errorReason
              }
            }
          }
        }

        console.log(`🎯 Fetching odds for: ${selection.player} (parallel)`)
        const oddsData = await fetchOddsForSelection(selection, apiKey, activeSportsbooks)
        return {
          ...selection,
          currentOdds: oddsData
        }
      } catch (error) {
        console.error(`❌ Error fetching odds for ${selection.player}:`, error)
        return {
          ...selection,
          currentOdds: {
            error: 'Failed to fetch odds',
            metadata: {
              matches_found: 0,
              total_bookmakers: 0,
              best_odds: null,
              best_book: null,
              player_searched: selection.player || '',
              line_searched: selection.line || 0,
              bet_type_searched: selection.betType,
              market_searched: selection.marketApiKey,
              last_updated: new Date().toISOString(),
              error: 'Failed to fetch odds'
            }
          }
        }
      }
    })

    // Start hit rates fetching in parallel
    const hitRatesPromise = (async () => {
      try {
        console.log(`📊 Fetching hit rate data for ${processedSelections.length} selections (parallel)...`)
        const hitRatesData = await fetchHitRatesForSelections(processedSelections)
        console.log(`✅ Hit rate data fetched for ${Object.keys(hitRatesData).length} players`)
        return hitRatesData
      } catch (error) {
        console.error(`❌ Error fetching hit rates:`, error)
        return {}
      }
    })()

    // Execute odds fetching and hit rates in parallel
    const [selectionsWithOdds, hitRatesData] = await Promise.all([
      Promise.all(oddsPromises),
      hitRatesPromise
    ])

    console.log(`🚀 Staggered processing complete!`)
    console.log(`✅ Odds fetched for ${selectionsWithOdds.length} selections`)
    console.log(`✅ Hit rates fetched for ${Object.keys(hitRatesData).length} players`)

    // Save to database
    let savedBetslipId = null
    try {
      savedBetslipId = await saveBetslipToDatabase(
        user.id,
        `/uploads/betslips/${imageFile.name}`, // You'll need to implement file upload
        sportsbook,
        selectionsWithOdds,
        extractedText,
        llmResult.data,
        confidence,
        apiKey !== undefined && apiKey !== null,
        hitRatesData
      )

      console.log(`💾 Betslip saved successfully: ${savedBetslipId}`)
      
    } catch (dbError) {
      console.error('Database save failed:', dbError)
      // Don't fail the request, just log the error
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        sportsbook,
        totalSelections: selectionsWithOdds.length,
        confidence,
        selections: selectionsWithOdds,
        userId: user.id,
        savedAt: new Date().toISOString(),
        savedBetslipId: savedBetslipId, // Include the betslip ID for redirect
        oddsData: {
          successfulOddsFetches: selectionsWithOdds.filter(s => 
            s.currentOdds?.metadata?.matches_found > 0
          ).length,
          failedOddsFetches: selectionsWithOdds.filter(s => 
            s.currentOdds?.error || s.currentOdds?.metadata?.matches_found === 0
          ).length,
          totalBookmakers: activeSportsbooks.length
        }
      }
    })

  } catch (error) {
    console.error('❌ Betslip extraction failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process betslip',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 