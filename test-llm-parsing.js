// Test script for LLM parsing
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function testLLMParsing() {
  // Sample OCR text from your FanDuel betslip
  const ocrText = `3 leg parlay
PROFIT BOOST 30%
+11185 +14540
Byron Buxton To Hit A Home Run, Willy Adames To Hit A
Home Run, Luis Robert To Record A Stolen Base
Byron Buxton
TO HIT A HOME RUN
+434
Texas Rangers (P Corbin) @ Minnesota Twins (B... 12:11PM CT
Willy Adames
$
TO HIT A HOME RUN
+434
San Francisco Giants (H Birdsong) @ Colorado R... 2:11PM CT
Luis Robert
+412
TO RECORD A STOLEN BASE
Chicago White Sox (D Martin) @ Houston Astros (... 7:11PM CT`

  const prompt = `You are an expert sports betting slip parser. Extract all individual player prop bets from this OCR text.

MARKET STANDARDIZATION:
- "TO HIT A HOME RUN" → "Home Runs"
- "TO RECORD A STOLEN BASE" → "Stolen Bases"  
- "TO RECORD X+ HITS" or "X+ HITS" → "Hits"
- "X+ STRIKEOUTS" or "STRIKEOUTS" → "Strikeouts"
- "TO RECORD X+ TOTAL BASES" or "X+ TOTAL BASES" → "Total Bases"
- "TO RECORD X+ RBIS" or "X+ RBIS" → "RBIs"

RULES:
1. Only extract individual player props, ignore team totals
2. Standardize market names using the mapping above
3. Extract exact player names (First Last format)
4. Include odds with proper +/- formatting
5. Parse team matchups from game info lines
6. Extract game times in original format
7. Ignore single characters, team logos, or UI elements

OCR TEXT:
${ocrText}

Return a valid JSON array with this exact format:
[
  {
    "player": "Player Name",
    "market": "Standardized Market",
    "odds": "+434",
    "awayTeam": "Away Team",
    "homeTeam": "Home Team",
    "gameTime": "12:11PM CT"
  }
]

Return only the JSON array, no other text.`

  try {
    console.log('🤖 Testing LLM parsing...')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    })

    const content = response.choices[0].message.content
    console.log('🤖 OpenAI response:', content)

    const parsedSelections = JSON.parse(content)
    console.log('✅ Successfully parsed selections:', parsedSelections)
    
    console.log('\n📊 Summary:')
    parsedSelections.forEach((selection, i) => {
      console.log(`${i + 1}. ${selection.player} - ${selection.market} (${selection.odds})`)
      console.log(`   Game: ${selection.awayTeam} @ ${selection.homeTeam} ${selection.gameTime}`)
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testLLMParsing() 