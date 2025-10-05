#!/usr/bin/env node

// Simple test script for EV API
// Run with: node scripts/test-ev-api.js

const BASE_URL = 'http://localhost:3000' // Adjust if needed

async function testAPI(endpoint, description) {
  console.log(`\n🧪 Testing: ${description}`)
  console.log(`📡 ${endpoint}`)
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    const data = await response.json()
    
    console.log(`✅ Status: ${response.status}`)
    console.log(`📊 Response:`, JSON.stringify(data, null, 2))
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Testing EV API Implementation\n')
  
  // Test 1: Basic EV plays
  await testAPI('/api/ev-plays', 'Basic EV plays')
  
  // Test 2: Filtered EV plays
  await testAPI('/api/ev-plays?sports=nfl&min_ev=2&limit=5', 'Filtered EV plays (NFL, min 2% EV)')
  
  // Test 3: API documentation
  await testAPI('/api/ev-plays', 'API documentation (OPTIONS)')
  
  // Test 4: Invalid parameters
  await testAPI('/api/ev-plays?sports=invalid&min_ev=abc', 'Invalid parameters test')
  
  console.log('\n✅ Test suite complete!')
  console.log('\n💡 Next steps:')
  console.log('1. Check if your Redis has ev:nfl:pregame keys')
  console.log('2. If no data, the API will return empty results (expected)')
  console.log('3. Test expansion API once you have real play data')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
}

export { testAPI, runTests }


