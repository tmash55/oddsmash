#!/usr/bin/env node

// Check what EV keys exist in Redis and test our API
import { redis } from '../lib/redis.js'

async function checkEVKeys() {
  console.log('🔍 Checking Redis for EV keys...\n')
  
  try {
    // Check for EV keys
    console.log('1. Looking for ev:* keys...')
    const evKeys = await redis.keys('ev:*')
    console.log(`   Found ${evKeys.length} EV keys:`)
    evKeys.forEach(key => console.log(`   - ${key}`))
    
    if (evKeys.length === 0) {
      console.log('   ℹ️  No EV keys found. This means your ingestor hasn\'t created them yet.')
    }
    
    // Check for odds keys (might help understand structure)
    console.log('\n2. Looking for odds:* keys (for reference)...')
    const oddsKeys = await redis.keys('odds:*')
    console.log(`   Found ${oddsKeys.length} odds keys`)
    if (oddsKeys.length > 0) {
      console.log('   Sample odds keys:')
      oddsKeys.slice(0, 5).forEach(key => console.log(`   - ${key}`))
      if (oddsKeys.length > 5) {
        console.log(`   ... and ${oddsKeys.length - 5} more`)
      }
    }
    
    // Check for arbitrage keys
    console.log('\n3. Looking for arb:* keys...')
    const arbKeys = await redis.keys('arb:*')
    console.log(`   Found ${arbKeys.length} arbitrage keys`)
    if (arbKeys.length > 0) {
      console.log('   Sample arb keys:')
      arbKeys.slice(0, 3).forEach(key => console.log(`   - ${key}`))
    }
    
    // Try to get sample data if EV keys exist
    if (evKeys.length > 0) {
      console.log('\n4. Sample EV data:')
      for (const key of evKeys.slice(0, 2)) {
        try {
          const data = await redis.get(key)
          if (data) {
            const parsed = JSON.parse(data)
            console.log(`   ${key}:`)
            console.log(`   - Type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`)
            console.log(`   - Length: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`)
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`   - Sample record:`, JSON.stringify(parsed[0], null, 4))
            }
          }
        } catch (e) {
          console.log(`   ❌ Error reading ${key}: ${e.message}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Redis:', error)
  }
}

async function testEVAPI() {
  console.log('\n🧪 Testing EV API endpoints...\n')
  
  const BASE_URL = 'http://localhost:3000'
  
  // Test basic endpoint
  try {
    console.log('Testing: GET /api/ev-plays')
    const response = await fetch(`${BASE_URL}/api/ev-plays`)
    const data = await response.json()
    
    console.log(`Status: ${response.status}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.success && data.data.length > 0) {
      console.log('\n✅ API is working and returning data!')
      console.log(`Found ${data.data.length} EV plays`)
      
      // Test expansion with first play
      const firstPlay = data.data[0]
      console.log('\nTesting expansion API with first play...')
      
      const params = new URLSearchParams({
        sport: firstPlay.sport,
        event_id: firstPlay.event_id,
        market: firstPlay.market,
        market_key: firstPlay.market_key,
        side: firstPlay.side,
        line: firstPlay.line.toString()
      })
      
      if (firstPlay.player_id) {
        params.set('player_id', firstPlay.player_id)
      }
      
      const expansionResponse = await fetch(`${BASE_URL}/api/ev-expansion?${params.toString()}`)
      const expansionData = await expansionResponse.json()
      
      console.log(`Expansion Status: ${expansionResponse.status}`)
      console.log('Expansion Response:', JSON.stringify(expansionData, null, 2))
      
    } else if (data.success) {
      console.log('\n⚠️  API is working but no data found. This is expected if no EV keys exist in Redis.')
    } else {
      console.log('\n❌ API returned an error')
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message)
    console.log('\n💡 Make sure your dev server is running: npm run dev')
  }
}

async function createSampleEVData() {
  console.log('\n🔧 Creating sample EV data for testing...\n')
  
  const sampleEVData = [
    {
      "id": "d5bcd5c6-3515-548d-99de-a72f828f262f:total:53.5:over",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "d5bcd5c6-3515-548d-99de-a72f828f262f",
      "market": "total",
      "side": "over",
      "line": 53.5,
      "ev_percentage": 9.779810292569291,
      "best_book": "fanduel",
      "best_odds": 300,
      "fair_odds": 264,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:total:game:alts:event:d5bcd5c6-3515-548d-99de-a72f828f262f:pregame",
      "home": "MIA",
      "away": "NYJ",
      "start": "2025-09-29T23:15:00.000Z"
    },
    {
      "id": "e96239a0-293e-52d1-b66e-612b1c843bcc:rush_attempts:00-0036158:15.5:over",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "e96239a0-293e-52d1-b66e-612b1c843bcc",
      "market": "rush_attempts",
      "side": "over",
      "player_id": "00-0036158",
      "player_name": "J.K. Dobbins",
      "team": "DEN",
      "position": "RB",
      "line": 15.5,
      "ev_percentage": 12.5,
      "best_book": "fanatics",
      "best_odds": 130,
      "fair_odds": 110,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:rush_attempts:alts:event:e96239a0-293e-52d1-b66e-612b1c843bcc:pregame",
      "home": "DEN",
      "away": "CIN",
      "start": "2025-09-30T00:15:00.000Z"
    }
  ]
  
  try {
    // Store sample data in Redis
    await redis.setex('ev:nfl:pregame', 300, JSON.stringify(sampleEVData)) // 5 min TTL
    console.log('✅ Created sample EV data at key: ev:nfl:pregame')
    console.log(`   - ${sampleEVData.length} sample records`)
    console.log('   - TTL: 5 minutes')
    
    return true
  } catch (error) {
    console.error('❌ Error creating sample data:', error)
    return false
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--create-sample')) {
    const created = await createSampleEVData()
    if (created) {
      console.log('\n✅ Sample data created! Now you can test the API.')
    }
    return
  }
  
  await checkEVKeys()
  
  // Only test API if we're not in a CI environment
  if (!process.env.CI) {
    await testEVAPI()
  }
  
  console.log('\n💡 Usage:')
  console.log('  node scripts/check-ev-keys.js                 # Check keys and test API')
  console.log('  node scripts/check-ev-keys.js --create-sample # Create sample data for testing')
}

main().catch(console.error)


