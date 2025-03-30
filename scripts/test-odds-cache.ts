import { redis, generateOddsCacheKey, getCachedOdds, setCachedOdds } from '../lib/redis'

async function testOddsCache() {
  // Test data
  const testData = {
    sport: 'basketball_nba',
    eventId: 'test-event-123',
    market: 'player_points',
    bookmakers: ['draftkings', 'fanduel', 'betmgm'],
  }

  // Generate cache key
  const cacheKey = generateOddsCacheKey(testData)
  console.log('Generated cache key:', cacheKey)

  // Test setting cache
  const mockOddsData = {
    id: testData.eventId,
    sport_key: testData.sport,
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        markets: [
          {
            key: 'player_points',
            outcomes: [
              {
                name: 'Over',
                price: -110,
                point: 25.5,
                description: 'Stephen Curry',
              },
              {
                name: 'Under',
                price: -110,
                point: 25.5,
                description: 'Stephen Curry',
              },
            ],
          },
        ],
      },
    ],
  }

  console.log('\nSetting test data in cache...')
  await setCachedOdds(cacheKey, mockOddsData)

  // Test getting from cache
  console.log('\nRetrieving from cache...')
  const cachedData = await getCachedOdds(cacheKey)
  console.log('Cache hit:', !!cachedData)
  if (cachedData) {
    console.log('Last updated:', cachedData.lastUpdated)
    console.log('Sample data:', {
      eventId: cachedData.data.id,
      numBookmakers: cachedData.data.bookmakers.length,
      sampleMarket: cachedData.data.bookmakers[0]?.markets[0]?.key,
    })
  }

  // Test cache expiration
  console.log('\nWaiting for cache to expire (5 seconds)...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  const expiredData = await getCachedOdds(cacheKey)
  console.log('Cache hit after expiration:', !!expiredData)

  // Cleanup
  await redis.del(cacheKey)
  console.log('\nTest complete and cache cleaned up')
}

// Run the test
testOddsCache().catch(console.error) 