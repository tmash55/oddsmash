// Simple test script to debug Google credentials
require('dotenv').config({ path: '.env.local' })

// Test environment variables
console.log('🧪 Testing Google credentials environment variables...\n')

const requiredVars = [
  'GOOGLE_PROJECT_ID',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_PRIVATE_KEY_ID',
  'GOOGLE_CLIENT_ID'
]

console.log('📋 Environment Variables Check:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  console.log(`${varName}: ${value ? '✅ Present' : '❌ Missing'}`)
  if (value && varName === 'GOOGLE_PRIVATE_KEY') {
    console.log(`  Preview: ${value.substring(0, 50)}...`)
  } else if (value) {
    console.log(`  Value: ${value}`)
  }
})

// Test our utility function
console.log('\n🔧 Testing getGoogleCredentials function...')
try {
  // Import our utility
  const { getGoogleCredentials, hasGoogleCredentials } = require('./lib/google-credentials-simple.js')
  
  console.log('hasGoogleCredentials():', hasGoogleCredentials())
  
  if (hasGoogleCredentials()) {
    const credentials = getGoogleCredentials()
    console.log('✅ Credentials object created successfully')
    console.log('📋 Credentials structure:')
    console.log({
      type: credentials.type,
      project_id: credentials.project_id,
      client_email: credentials.client_email,
      has_private_key: !!credentials.private_key,
      private_key_starts_with: credentials.private_key?.substring(0, 30) + '...'
    })
  }
} catch (error) {
  console.error('❌ Error testing credentials:', error.message)
}

console.log('\n�� Test complete!') 