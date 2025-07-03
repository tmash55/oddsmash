// Simple test script for the new Redis-first odds API
const testPlayerIds = [666176]; // Jo Adell
const market = "Hits";
const sport = "mlb";

const url = `http://localhost:3000/api/player-odds?playerIds=${testPlayerIds.join(',')}&sport=${sport}&market=${market}`;

console.log('Testing new Redis-first player odds API...');
console.log('URL:', url);
console.log('Expected Redis key: odds:mlb:666176:batter_hits');

fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log('\nResponse:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
