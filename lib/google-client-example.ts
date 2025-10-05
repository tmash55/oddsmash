/**
 * Example usage of Google credentials in your application
 * 
 * This file shows how to use the credentials utilities.
 * You'll need to install the appropriate Google packages:
 * 
 * npm install google-auth-library
 * npm install @google-cloud/storage (if using Cloud Storage)
 * npm install googleapis (if using Google APIs)
 */

import { initGoogleCredentials, getGoogleCredentials } from './google-credentials';

// Basic initialization - call this at the start of your API routes
export function setupGoogleCredentials() {
  initGoogleCredentials();
  console.log('Google credentials initialized');
}

// Get credentials as an object for direct SDK usage
export function getCredentialsObject() {
  return getGoogleCredentials();
}

// Example usage in an API route:
/*
import { setupGoogleCredentials } from '@/lib/google-client-example';

export async function GET() {
  // Initialize credentials
  setupGoogleCredentials();
  
  // Now you can use any Google SDK
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  
  // Your Google API logic here...
}
*/ 