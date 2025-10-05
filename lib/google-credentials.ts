import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Initialize Google Application Credentials for Vercel deployment
 * This handles the credentials whether they're in a local file or base64 encoded in env vars
 */
export function initGoogleCredentials() {
  // If running locally and credentials file exists, use it directly
  if (process.env.NODE_ENV !== 'production' && existsSync('./google-credentials.json')) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = './google-credentials.json';
    return;
  }

  // For production/Vercel, use base64 encoded credentials
  const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  
  if (!base64Credentials) {
    console.warn('No Google credentials found. Some features may not work.');
    return;
  }

  try {
    // Decode base64 credentials
    const credentialsJson = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    
    // Write to temporary file in serverless environment
    const tempFilePath = join(tmpdir(), 'google-credentials.json');
    writeFileSync(tempFilePath, credentialsJson);
    
    // Set environment variable to point to temp file
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
    
    console.log('Google credentials initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google credentials:', error);
  }
}

/**
 * Get Google credentials as a parsed object (alternative approach)
 * Use this if you want to pass credentials directly to Google SDK
 */
export function getGoogleCredentials(): object | null {
  const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  
  if (!base64Credentials) {
    return null;
  }

  try {
    const credentialsJson = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    return JSON.parse(credentialsJson);
  } catch (error) {
    console.error('Failed to parse Google credentials:', error);
    return null;
  }
} 