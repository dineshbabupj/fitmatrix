import {
  signInAnonymously as firebaseSignInAnonymously,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const authService = {
  /**
   * Anonymous Sign-In
   */
  signInAnonymously: async (): Promise<AuthUser> => {
    try {
      const userCredential = await firebaseSignInAnonymously(auth);
      const user = userCredential.user;
      return {
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        email: user.email,
        displayName: user.displayName || 'Guest User',
        photoURL: user.photoURL,
      };
    } catch (error) {
      console.error('Anonymous Sign-In Error:', error);
      throw error;
    }
  },

  /**
   * Google Sign-In with OAuth ID Token
   */
  signInWithGoogle: async (idToken?: string): Promise<AuthUser> => {
    try {
      if (!idToken) {
        // Fallback demo token for simulation mode
        return authService.signInAnonymously();
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      return {
        uid: user.uid,
        isAnonymous: false,
        email: user.email,
        displayName: user.displayName || 'Google User',
        photoURL: user.photoURL,
      };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  },

  /**
   * Apple Sign-In with Identity Token
   */
  signInWithApple: async (identityToken?: string, nonce?: string): Promise<AuthUser> => {
    try {
      if (!identityToken) {
        return authService.signInAnonymously();
      }
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      return {
        uid: user.uid,
        isAnonymous: false,
        email: user.email,
        displayName: user.displayName || 'Apple User',
        photoURL: user.photoURL,
      };
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      throw error;
    }
  },

  /**
   * Sign Out
   */
  signOut: async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  },

  /**
   * Auth State Changed Listener
   */
  onAuthStateChangedListener: (callback: (user: AuthUser | null) => void) => {
    return onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        callback({
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        callback(null);
      }
    });
  },

  /**
   * Get Current User
   */
  getCurrentUser: (): AuthUser | null => {
    const user = auth.currentUser;
    if (!user) return null;
    return {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  },
};
