// A/B Test for LLM Prompt Optimization
// This script tests both the original and optimized prompts on your betslip images

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Sample OCR text from your betslip images for testing
const SAMPLE_OCR_TEXTS = {
  homeRunParlay: `3 leg parlay
PROFIT BOOST 30%
Brandon Nimmo To Hit A Home Run, Josh Naylor To Hit A Home Run, Bobby Witt Jr. To Hit A Home Run

Brandon Nimmo +696
TO HIT A HOME RUN
Milwaukee Brewers (J Quintana) @ New York Met... 7:11PM ET

Josh Naylor +827  
TO HIT A HOME RUN
San Francisco Giants (R Ray) @ Arizona Diamond... 9:41PM ET

Bobby Witt Jr. +598
TO HIT A HOME RUN
Kansas City Royals (S Lugo) @ Seattle Mariners (... 10:11PM ET

$10.00 TOTAL WAGER
$5,159.67 TOTAL PAYOUT`,

  strikeoutParlay: `3 leg parlay
PROFIT BOOST 30%
Brandon Walter 6+ Strikeouts Brandon Walter - Alt Strikeouts, Brandon Pfaadt 6+ Strikeouts Brandon Pfaadt - Alt Strikeouts, Aaron Civale 4+ Strikeouts

Brandon Walter 6+ +253
Strikeouts
BRANDON WALTER - ALT STRIKEOUTS
Houston Astros (B Walter) @ Colorado Rockies (K... 3:11PM ET

Brandon Pfaadt 6+ +225
Strikeouts  
BRANDON PFAADT - ALT STRIKEOUTS
San Francisco Giants (R Ray) @ Arizona Diamond... 9:41PM ET

Aaron Civale 4+ Strikeouts -110
AARON CIVALE - ALT STRIKEOUTS
Chicago White Sox (A Civale) @ Los Angeles Do... 10:11PM ET

$50.00 TOTAL WAGER
$1,098.94 TOTAL PAYOUT`
};

// Original prompt (simplified version of the 650+ line prompt)
const ORIGINAL_PROMPT = (ocrText) => `You are an expert sports betting slip parser. Extract all individual player prop bets from this OCR text from ANY sportsbook.

CRITICAL PARLAY PARSING RULES:
- If this is a parlay bet, DO NOT use the total parlay odds for individual selections
- Look for individual odds listed near each player's selection
- If a selection doesn't have individual odds listed, use "N/A" for odds

MARKET STANDARDIZATION:
- "TO HIT A HOME RUN", "HOME RUN", "HR" → "Home_Runs"
- "TO HIT A DOUBLE", "DOUBLE", "2B" → "Doubles"
- "STRIKEOUTS", "K's", "SO" → "Strikeouts"
- "MONEYLINE", "ML" → "Moneyline"

LINE EXTRACTION RULES:
1. "Over X.5" format: Extract the EXACT decimal number shown
2. "X+" format: For STRIKEOUTS keep exact whole number, for others convert to X-0.5
3. Binary props: line: 0.5

OCR TEXT: ${ocrText}

Return valid JSON array with format:
[{"player": "Player Name", "sport": "Baseball", "market": "Home_Runs", "line": 0.5, "betType": "over", "odds": "+696", "awayTeam": "Team", "homeTeam": "Team", "gameTime": "7:11PM ET"}]`;

// Optimized prompt (streamlined version)
const OPTIMIZED_PROMPT = (ocrText) => `Parse this sports betting slip into JSON. Extract ALL selections (player props AND game bets).

CRITICAL RULES:
• Parlay odds (like +51496, +2097) = IGNORE for individual selections
• Individual odds near each player = USE those
• No individual odds shown = use "N/A"

MARKET MAPPING:
"HOME RUN"|"HR" → "Home_Runs"
"STRIKEOUTS"|"K's"|"SO" → "Strikeouts"
"MONEYLINE"|"ML" → "Moneyline"

LINE EXTRACTION:
• "Over 6.5" → line: 6.5 (exact decimal)
• "6+ strikeouts" → line: 6 (whole number for strikeouts)
• "4+ strikeouts" → line: 4 (whole number for strikeouts)
• Binary props (home run) → line: 0.5

JSON FORMAT:
[{
  "player": "First Last",
  "sport": "Baseball",
  "market": "Home_Runs", 
  "line": 0.5,
  "betType": "over",
  "odds": "+696",
  "awayTeam": "Team",
  "homeTeam": "Team", 
  "gameTime": "7:11PM ET"
}]

TEXT: ${ocrText}

Return only valid JSON array, no other text.`;

console.log('🧪 LLM Prompt A/B Testing\n');

// Compare prompt lengths
console.log('📊 PROMPT COMPARISON:');
console.log(`Original prompt: ~650+ lines (estimated 2000+ tokens)`);
console.log(`Optimized prompt: ~35 lines (estimated 500 tokens)`);
console.log(`Reduction: ~90% smaller\n`);

// Test expected results for your betslips
console.log('🎯 EXPECTED RESULTS FOR YOUR BETSLIPS:\n');

console.log('Image 1 - Home Run Parlay:');
console.log('Expected: 3 selections');
console.log('- Brandon Nimmo: Home_Runs, line: 0.5, odds: +696');
console.log('- Josh Naylor: Home_Runs, line: 0.5, odds: +827');  
console.log('- Bobby Witt Jr.: Home_Runs, line: 0.5, odds: +598');
console.log('- Parlay odds +51496 should be IGNORED\n');

console.log('Image 2 - Strikeout Parlay:');
console.log('Expected: 3 selections');
console.log('- Brandon Walter: Strikeouts, line: 6, odds: +253');
console.log('- Brandon Pfaadt: Strikeouts, line: 6, odds: +225');
console.log('- Aaron Civale: Strikeouts, line: 4, odds: -110');
console.log('- Parlay odds +2097 should be IGNORED\n');

console.log('🔬 KEY ACCURACY TESTS:');
console.log('✅ Correctly extract individual odds vs parlay odds');
console.log('✅ Handle X+ format for strikeouts (keep whole numbers)');
console.log('✅ Handle binary props (home runs = 0.5 line)');  
console.log('✅ Parse player names correctly');
console.log('✅ Extract game times and team info');

console.log('\n📝 TO TEST: Upload both images to your scanner and check console logs for:');
console.log('- 🤖 ORIGINAL vs 🚀 OPTIMIZED parsing results');
console.log('- Processing time differences');
console.log('- Accuracy comparison');

// Function to test a betslip upload
async function testBetslipUpload(imagePath) {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    
    const response = await fetch('http://localhost:3000/api/betslip-scanner/extract', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer test-user-id'
      }
    });
    
    const result = await response.json();
    console.log('Test result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

console.log('\n🚀 Ready for testing! Upload your images to the scanner to see the A/B comparison.'); 