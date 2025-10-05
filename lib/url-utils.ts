import config from "@/config"

/**
 * Get the base URL for API calls, handling both client-side and server-side environments
 */
export function getBaseUrl(): string {
  // Client-side: use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server-side: use config domain for production, fallback for development
  if (process.env.NODE_ENV === 'production') {
    return `https://${config.domainName}`
  }
  
  // Development fallback
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

/**
 * Get the full URL for the site (used for OG images, share links, etc.)
 */
export function getSiteUrl(): string {
  return process.env.NODE_ENV === 'production' 
    ? `https://${config.domainName}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
} 