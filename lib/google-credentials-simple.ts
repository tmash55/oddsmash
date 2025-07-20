/**
 * Simple Google Service Account credentials from environment variables
 * Perfect for single API route usage
 */
export function getGoogleCredentials() {
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  };

  // Validate required fields
  const requiredFields = ['project_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !credentials[field as keyof typeof credentials]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Google credentials: ${missingFields.join(', ')}`);
  }

  return credentials;
}

/**
 * Check if Google credentials are properly configured
 */
export function hasGoogleCredentials(): boolean {
  return !!(
    process.env.GOOGLE_PROJECT_ID &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_CLIENT_EMAIL
  );
} 