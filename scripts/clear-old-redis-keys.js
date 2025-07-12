import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local');
if (!existsSync(envPath)) {
  console.error('Error: .env.local file not found');
  process.exit(1);
}
dotenv.config({ path: envPath });

// Initialize Redis client
const redis = new Redis({
  url: 'https://finer-basilisk-19142.upstash.io',
  token: 'AUrGAAIjcDFjOGUyMWUxOTA3NDY0NzAwOTFiMGU3OWMzYzVjN2QyMHAxMA',
});

async function clearOldRedisKeys() {
  const BATCH_SIZE = 100;
  let cursor = '0';
  let deletedCount = 0;
  
  console.log('Starting cleanup of old Redis keys...');
  
  try {
    // Test connection
    console.log('Testing Redis connection...');
    await redis.ping();
    console.log('Redis connection successful!');
    
    // First, let's check the specific key
    const specificKey = 'odds:mlb:02963f093cc9cf5ff7c8b72e0b265ebe';
    const value = await redis.get(specificKey);
    console.log(`\nChecking specific key ${specificKey}:`);
    console.log('Value:', value);
    
    do {
      console.log(`\nScanning with cursor: ${cursor}`);
      // SCAN through keys in batches
      const [newCursor, keys] = await redis.scan(cursor, {
        match: 'odds:*',
        count: BATCH_SIZE
      });
      cursor = newCursor;
      
      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys to process`);
        
        // Filter for old format keys
        const oldFormatKeys = keys.filter(key => {
          const parts = key.split(':');
          
          // Check for hash:id:market pattern (e.g. odds:mlb:12aac445fabac34890553bfa00ac48d2:672724:batter_total_bases)
          if (parts.length === 5 && /^[a-f0-9]{32}$/.test(parts[2]) && /^\d+$/.test(parts[3])) {
            console.log(`Found old format key with hash and ID: ${key}`);
            return true;
          }
          
          // Check for just hash pattern (e.g. odds:mlb:02963f093cc9cf5ff7c8b72e0b265ebe)
          if (parts.length === 3 && /^[a-f0-9]{32}$/.test(parts[2])) {
            console.log(`Found old format key with hash: ${key}`);
            return true;
          }
          
          return false;
        });
        
        if (oldFormatKeys.length > 0) {
          console.log(`Deleting ${oldFormatKeys.length} old format keys...`);
          for (const key of oldFormatKeys) {
            await redis.del(key);
            deletedCount++;
            console.log(`Deleted key: ${key}`);
          }
        }
      } else {
        console.log('No keys found in this batch');
      }
      
    } while (cursor !== '0');
    
    console.log(`Cleanup complete! Deleted ${deletedCount} old format keys.`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Run the cleanup
clearOldRedisKeys().catch(console.error); 