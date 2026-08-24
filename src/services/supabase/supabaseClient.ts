import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import 'react-native-url-polyfill/auto';
import { useUserAuthStore, UserProfileAuth } from '../../store/userAuthStore';
import { revenueCatService } from '../iap/revenueCatService';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Update the auth store with user info from Supabase session.
 * Called after deep link auth to ensure UI updates.
 */
function syncAuthStore(user: any) {
  if (!user) return;
  try {
    const userProfile: UserProfileAuth = {
      uid: user.id,
      email: user.email || undefined,
      phoneNumber: user.phone || undefined,
      displayName:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split('@')[0] : 'Fitness Member'),
      photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
      isAnonymous: false,
      createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
    };
    useUserAuthStore.getState().setUser(userProfile);
    // Link RevenueCat so purchases persist across devices
    revenueCatService.logIn(user.id).catch(() => {});
    console.log('[Supabase] Auth store updated for:', userProfile.email);
  } catch (e) {
    console.warn('[Supabase] Failed to sync auth store:', e);
  }
}

export async function handleAuthDeepLink(url: string) {
  try {
    const parsed = Linking.parse(url);
    const queryParams = parsed.queryParams || {};
    
    const access_token = queryParams.access_token as string;
    const refresh_token = queryParams.refresh_token as string;
    const code = queryParams.code as string;
    const type = parsed.hostname || parsed.path;
    
    console.log('[Supabase] Deep link received:', url, 'type:', type);
    
    // Handle code exchange (PKCE flow)
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[Supabase] Code exchange error:', error.message);
      } else if (data?.user) {
        console.log('[Supabase] Session set via code exchange:', data.user.email);
        syncAuthStore(data.user);
      }
      return;
    }
    
    // Handle direct token flow
    if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) {
        console.error('[Supabase] Set session error:', error.message);
      } else if (data?.user) {
        console.log('[Supabase] Session set via tokens:', data.user.email);
        syncAuthStore(data.user);
      }
      return;
    }
    
    // Handle fragment-based tokens (some OAuth providers use #access_token=...)
    if (url.includes('#')) {
      const hash = url.split('#')[1];
      const params = new URLSearchParams(hash);
      const hashAccess = params.get('access_token');
      const hashRefresh = params.get('refresh_token');
      
      if (hashAccess && hashRefresh) {
        const { data, error } = await supabase.auth.setSession({
          access_token: hashAccess,
          refresh_token: hashRefresh,
        });
        if (error) {
          console.error('[Supabase] Hash session error:', error.message);
        } else if (data?.user) {
          console.log('[Supabase] Session set via hash tokens:', data.user.email);
          syncAuthStore(data.user);
        }
      }
    }
  } catch (err) {
    console.error('[Supabase] Deep link handling error:', err);
  }
}
