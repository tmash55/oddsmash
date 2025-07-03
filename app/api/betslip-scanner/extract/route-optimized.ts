// Optimized LLM prompt function for betslip scanning
async function parseWithLLMOptimized(ocrText: string): Promise<BetSelection[]> {
  try {
    const prompt = `Parse this sports betting slip into JSON. Extract ALL selections (player props AND game bets).

CRITICAL RULES:
• Parlay odds (like +3200) = IGNORE for individual selections
• Individual odds near each player = USE those
• No individual odds shown = use "N/A"

MARKET MAPPING:
"HOME RUN"|"HR" → "Home_Runs"
"HITS"|"1+ HITS" → "Hits" 
"DOUBLE"|"2B" → "Doubles"
"TRIPLE"|"3B" → "Triples"
"STOLEN BASE"|"SB" → "Stolen_Bases"
"STRIKEOUTS"|"K's"|"SO" → "Strikeouts"
"TOTAL BASES"|"TB" → "Total_Bases"
"RBI"|"RUNS BATTED IN" → "RBIs"
"H+R+RBI"|"HITS + RUNS + RBIS" → "Hits_Runs_RBIs"
"RUNS SCORED"|"RUNS" → "Runs"
"OUTS RECORDED"|"INNINGS" → "Outs_Recorded"
"MONEYLINE"|"ML" → "Moneyline"
"SPREAD"|"RUN LINE" → "Spread"
"TOTAL"|"OVER/UNDER" → "Total"

LINE EXTRACTION (CRITICAL):
• "Over 6.5" → line: 6.5 (exact decimal)
• "6+ strikeouts" → line: 6 (whole number for strikeouts)
• "2+ hits" → line: 1.5 (X+ format = X-0.5 for non-strikeouts)
• "+1.5 spread" → line: 1.5 (underdog)
• "-1.5 spread" → line: -1.5 (favorite)
• Binary props (home run, hit) → line: 0.5

SPORT DETECTION:
Baseball indicators: MLB teams, "strikeouts", "runs", "hits"
Basketball: NBA teams, "points", "rebounds", "assists"
Return: "Baseball", "Basketball", "Hockey", "Football"

JSON FORMAT:
[{
  "player": "First Last" | "Team Name",
  "sport": "Baseball",
  "market": "Strikeouts", 
  "line": 6.5,
  "betType": "over"|"under"|"moneyline"|"spread",
  "odds": "+450"|"N/A",
  "awayTeam": "Team",
  "homeTeam": "Team", 
  "gameTime": "6:40 PM"
}]

TEXT: ${ocrText}

Return only valid JSON array, no other text.`

    console.log('🤖 Sending betslip to OpenAI for parsing (OPTIMIZED)...')
    console.log('📝 OCR Text Preview (first 500 chars):', ocrText.substring(0, 500))
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    console.log('🤖 OpenAI response:', content)

    // Clean and parse the JSON response
    let cleanedContent = content.trim()
    
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    console.log('🧹 Cleaned content for parsing:', cleanedContent.substring(0, 200) + '...')

    const parsedSelections = JSON.parse(cleanedContent)
    
    if (!Array.isArray(parsedSelections)) {
      throw new Error('OpenAI did not return an array')
    }

    console.log(`🎯 LLM found ${parsedSelections.length} selections`)

    // Convert to our BetSelection format
    const selections: BetSelection[] = parsedSelections.map((selection: any, index: number) => {
      const sportApiKey = mapSportToApiKey(selection.sport)
      const marketApiKey = getMarketApiKey(sportApiKey, selection.market)
      
      let line = selection.line || 0.5
      
      // Smart defaults based on market
      if (!selection.line) {
        const defaults: Record<string, number | null> = {
          'Home_Runs': 0.5, 'Stolen_Bases': 0.5, 'Hits': 0.5, 'Doubles': 0.5,
          'Triples': 0.5, 'Singles': 0.5, 'RBIs': 0.5, 'Runs': 0.5,
          'Strikeouts': 5.5, 'Total_Bases': 1.5, 'Hits_Runs_RBIs': 2.5,
          'Outs_Recorded': 16.5, 'Earned_Runs': 2.5,
          'Points': 15.5, 'Rebounds': 7.5, 'Assists': 5.5,
          'Moneyline': null, 'Spread': 1.5, 'Total': 8.5
        }
        line = defaults[selection.market] ?? 0.5
      }

      // Determine bet type
      let betType: 'over' | 'under' | 'moneyline' | 'spread' = 'over'
      
      if (selection.betType && ['over', 'under', 'moneyline', 'spread'].includes(selection.betType)) {
        betType = selection.betType
      } else if (selection.market === 'Moneyline') {
        betType = 'moneyline'
      } else if (selection.market === 'Spread') {
        betType = 'spread'
      } else {
        // Check for "under" in context
        const rawTextLower = ocrText.toLowerCase()
        const playerNameLower = selection.player?.toLowerCase() || ''
        const playerContext = rawTextLower.includes(playerNameLower) 
          ? rawTextLower.substring(rawTextLower.indexOf(playerNameLower))
          : rawTextLower
        
        if (playerContext.includes('under') && !playerContext.includes('over')) {
          betType = 'under'
        }
      }

      // Fix spread signs based on odds
      if (selection.market === 'Spread' && selection.line && selection.odds) {
        const odds = parseFloat(selection.odds.replace(/[^-\d.]/g, ''))
        if (odds < 0 && line > 0) {
          line = -Math.abs(line)
        } else if (odds > 0 && line < 0) {
          line = Math.abs(line)
        }
      }

      const betSelection: BetSelection = {
        id: `${index + 1}`,
        player: selection.player,
        market: selection.market,
        line: line,
        betType: betType,
        sport: selection.sport,
        sportApiKey: sportApiKey,
        marketApiKey: marketApiKey,
        confidence: 0.9,
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

    console.log(`✅ Successfully parsed ${selections.length} selections with LLM (OPTIMIZED)`)

    return selections

  } catch (error) {
    console.error('❌ LLM parsing failed:', error)
    console.error('Raw OCR text that failed:', ocrText.substring(0, 1000))
    return []
  }
} 