import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useUserAuthStore, UserProfileAuth } from '../../store/userAuthStore';
import { supabase } from '../supabase/supabaseClient';
import { getEmailRedirectUrl, getGoogleRedirectUrl } from '../../config/authRedirects';
import { revenueCatService } from '../iap/revenueCatService';

let GoogleSignin: any;
let statusCodes: any;
try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
} catch (e) {
  console.warn('[Auth] @react-native-google-signin/google-signin not available (Expo Go mode)');
}
WebBrowser.maybeCompleteAuthSession();

class SupabaseAuthService {
  constructor() {
    this.configureGoogleSignIn();
  }

  private configureGoogleSignIn() {
    if (!GoogleSignin) return; // Skip in Expo Go
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '676155774371-gl5e6f7qh4l3ggc1lu54pug4brtajs8r.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      });
    } catch (error) {
      console.warn('[SupabaseAuthService] GoogleSignin config error:', error);
    }
  }

  /**
   * Helper to set user in auth store
   */
  private handleUserLoggedIn(user: any, fallbackPhone?: string) {
    const userProfile: UserProfileAuth = {
      uid: user.id,
      email: user.email || undefined,
      phoneNumber: user.phone || fallbackPhone,
      displayName:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split('@')[0] : `Fitness Member`),
      photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
      isAnonymous: false,
      createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
    };

    useUserAuthStore.getState().setUser(userProfile);

    // Link RevenueCat to this user so purchases persist across devices
    revenueCatService.logIn(user.id).catch(() => {});

    return userProfile;
  }

  /**
   * Google Sign-In Native (Mobile Popup) with Supabase
   */
  public async signInWithGoogle(): Promise<{ success: boolean; message: string }> {
    if (!GoogleSignin) {
      console.warn('[Auth] Google Sign-In not supported in Expo Go');
      return this.signInWithGoogleWebFallback();
    }
    
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.idToken,
        });
        
        if (error) throw error;
        
        if (data.user) {
          this.handleUserLoggedIn(data.user);
          return {
            success: true,
            message: `Welcome back, ${data.user.user_metadata?.full_name || data.user.email}!`,
          };
        }
      }
      
      throw new Error('No ID token present!');
    } catch (error: any) {
      console.warn('[SupabaseAuthService] signInWithGoogle native error:', error);
      
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        return { success: false, message: 'Google Sign-In was cancelled.' };
      } else if (error.code === statusCodes?.IN_PROGRESS) {
        return { success: false, message: 'Sign in is in progress already.' };
      }
      
      // Auto-fallback to web browser OAuth on DEVELOPER_ERROR / PLAY_SERVICES_NOT_AVAILABLE
      console.log('[SupabaseAuthService] Falling back to Web OAuth session due to native error:', error.message);
      return this.signInWithGoogleWebFallback();
    }
  }

  /**
   * Google Sign-In Web Fallback (if native fails or play services missing)
   */
  private async signInWithGoogleWebFallback(): Promise<{ success: boolean; message: string }> {
    try {
      const redirectUrl = getGoogleRedirectUrl();
      console.log('[SupabaseAuthService] Google redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No authentication URL returned from Supabase.');

      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (authResult.type === 'success' && authResult.url) {
        const parsedUrl = Linking.parse(authResult.url);
        let access_token = parsedUrl.queryParams?.access_token as string;
        let refresh_token = parsedUrl.queryParams?.refresh_token as string;
        let code = parsedUrl.queryParams?.code as string;

        if (!access_token && authResult.url.includes('#')) {
          const hash = authResult.url.split('#')[1];
          const params = new URLSearchParams(hash);
          access_token = params.get('access_token') || '';
          refresh_token = params.get('refresh_token') || '';
        }

        if (code) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionErr) throw sessionErr;
          if (sessionData.user) {
            this.handleUserLoggedIn(sessionData.user);
            return {
              success: true,
              message: `Welcome back!`,
            };
          }
        } else if (access_token && refresh_token) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionErr) throw sessionErr;
          if (sessionData.user) {
            this.handleUserLoggedIn(sessionData.user);
            return {
              success: true,
              message: `Welcome back!`,
            };
          }
        } else {
          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession?.session?.user) {
            this.handleUserLoggedIn(currentSession.session.user);
            return {
              success: true,
              message: 'Google Sign-In successful!',
            };
          }
        }
      }

      if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
        return { success: false, message: 'Google Sign-In was cancelled.' };
      }

      // If we reach here, auth completed but no tokens/code were extracted
      return { success: false, message: 'Google authentication completed but no session was created. Please try again.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Google Sign-In failed.' };
    }
  }

  /**
   * Email / Magic Link Login
   */
  public async signInWithEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const redirectUrl = getEmailRedirectUrl();
      console.log('[SupabaseAuthService] Email redirect URL:', redirectUrl);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: `Magic login link sent to ${email}.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Email login failed.',
      };
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
