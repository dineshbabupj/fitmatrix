/**
 * Auth Redirect URL Configuration
 * 
 * These are the PRODUCTION deep link URLs used for auth redirects.
 * In dev mode (Expo Go), Linking.createURL() returns exp:// URLs.
 * In production builds (EAS Build), it returns fitmetrics:// URLs.
 * 
 * IMPORTANT: These URLs must be registered in:
 * 1. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
 * 2. Google Cloud Console → OAuth 2.0 → Authorized redirect URIs
 */

import * as Linking from 'expo-linking';

const APP_SCHEME = 'fitmetrics';

/**
 * Get the correct redirect URL for the current environment.
 * - Development (Expo Go): returns exp://... URL
 * - Production (EAS Build): returns fitmetrics://... URL
 * 
 * For Supabase signInWithOtp emailRedirectTo, we ALWAYS use the deep link scheme
 * because Supabase sends this URL in the email — it must work when user clicks it
 * from their email app (outside Expo Go).
 */
export function getEmailRedirectUrl(): string {
  // In production builds, Linking.createURL returns the proper deep link
  // In dev, we force the deep link scheme so email links work
  const devUrl = Linking.createURL('email-auth');
  
  // If it's already a deep link (fitmetrics://), use it
  if (devUrl.startsWith(`${APP_SCHEME}://`)) {
    return devUrl;
  }
  
  // In dev mode, Linking.createURL returns exp://... 
  // Override with the proper deep link for email redirects
  // This ensures email verification links always point to the app
  return `${APP_SCHEME}://email-auth`;
}

/**
 * Get the redirect URL for Google OAuth flow.
 * This URL is where Supabase redirects after Google authentication.
 */
export function getGoogleRedirectUrl(): string {
  const devUrl = Linking.createURL('google-auth');
  
  if (devUrl.startsWith(`${APP_SCHEME}://`)) {
    return devUrl;
  }
  
  return `${APP_SCHEME}://google-auth`;
}

/**
 * All redirect URLs that must be registered in Supabase Dashboard.
 * Go to: Authentication → URL Configuration → Redirect URLs
 */
export const REDIRECT_URLS = [
  `${APP_SCHEME}://email-auth`,
  `${APP_SCHEME}://google-auth`,
  `${APP_SCHEME}://**`,  // Wildcard for any deep link
];
