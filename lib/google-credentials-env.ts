/**
 * Alternative approach: Use individual environment variables for Google credentials
 * This avoids the need for base64 encoding but requires more env vars
 */
export function initGoogleCredentialsFromEnv() {
  const credentials = {
    type: process.env.GOOGLE_TYPE || 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.GOOGLE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  };

  // Check if required fields are present
  if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
    console.warn('Missing required Google credentials environment variables');
    return null;
  }

  return credentials;
}

/**
 * Get Google credentials for direct SDK usage
 */
export function getGoogleCredentialsFromEnv() {
  return initGoogleCredentialsFromEnv();
} 