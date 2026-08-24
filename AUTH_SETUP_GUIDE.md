# 🔐 Google Auth & Email Magic Link — Complete Setup Guide

## Problem
When user clicks email magic link or Google OAuth callback → link goes to localhost instead of opening the app.

## Root Cause
Supabase dashboard-la redirect URLs configured aagala, so it defaults to localhost.

---

## ✅ What I Fixed in Code

### 1. `src/config/authRedirects.ts` (NEW)
- Centralized redirect URL configuration
- Always uses `fitmetrics://` deep link scheme (not dev URLs)
- Email links always point to `fitmetrics://email-auth`
- Google OAuth always redirects to `fitmetrics://google-auth`

### 2. `src/services/auth/supabaseAuthService.ts`
- `signInWithEmail()` now uses `getEmailRedirectUrl()` instead of `Linking.createURL()`
- `signInWithGoogleWebFallback()` now uses `getGoogleRedirectUrl()`
- Added logging for debug

### 3. `src/services/supabase/supabaseClient.ts`
- Added `handleAuthDeepLink()` function
- Handles code exchange (PKCE flow), direct tokens, and hash-based tokens
- Logs all deep link activity

### 4. `app/_layout.tsx`
- Added deep link URL listener
- App now properly handles incoming auth deep links on launch

### 5. `app.json`
- `scheme: "fitmetrics"` already set ✅
- Android `intentFilters` already configured ✅
- iOS `associatedDomains` already configured ✅

---

## 🔧 What You Need to Do Manually

### Step 1: Supabase Dashboard (MOST IMPORTANT)

Go to: **https://supabase.com/dashboard → Your Project → Authentication → URL Configuration**

#### Redirect URLs — Add these:
```
fitmetrics://email-auth
fitmetrics://google-auth
fitmetrics://**
```

#### Site URL — Set to:
```
fitmetrics://
```

---

### Step 2: Supabase → Enable Google Provider

Go to: **Authentication → Providers → Google**

1. **Enable** Google provider (toggle ON)
2. Enter these values:
   - **Client ID**: `676155774371-qbgco794iu7vv56uhu45bt83816196lv.apps.googleusercontent.com`
   - **Client Secret**: (Get from Google Cloud Console → Credentials → Web Client)

---

### Step 3: Google Cloud Console — OAuth Setup

Go to: **https://console.cloud.google.com/apis/credentials**

1. Find your **Web Client** (the one with Client ID `676155774371-...`)
2. Click on it
3. Under **Authorized redirect URIs**, add:
   ```
   https://xxeziownlhaanenbwkqv.supabase.co/auth/v1/callback
   ```
4. Click **Save**

---

### Step 4: Google Cloud Console — Android Client

Go to: **https://console.cloud.google.com/apis/credentials**

1. Find or create an **Android** OAuth Client ID:
   - **Package name**: `com.trichy360media.fitmetrics`
   - **SHA-1 certificate fingerprint**: 
     ```bash
     # Get this from your EAS build:
     eas credentials --platform android
     # Or from local keystore:
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey
     ```
2. Click **Create**

---

### Step 5: Firebase Console (if using Firebase Auth too)

Go to: **https://console.firebase.google.com → Project Settings → Your Android App**

1. Add **SHA-1 certificate fingerprint**:
   ```
   # From EAS build output or:
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
   ```
2. Download new `google-services.json`
3. Replace `fitmetrics-expo/google-services.json` with the new file

---

### Step 6: Rebuild the App

After all dashboard changes:
```bash
cd fitmetrics-expo

# Development test
npx expo start --clear

# Production build for Play Store
eas build -p android --profile production
```

---

## 🧪 How to Test

### Email Magic Link Test:
1. Open FitMetrics → Settings → Sign In → Email tab
2. Enter your email → click "Sign In with Email"
3. Check your email → click the magic link
4. ✅ Should open FitMetrics app (not localhost!)
5. ✅ Should be logged in

### Google Sign-In Test:
1. Open FitMetrics → Settings → Sign In → Google tab
2. Click "Continue with Google"
3. Select your Google account
4. ✅ Should redirect back to FitMetrics
5. ✅ Should be logged in

### Guest Mode Test:
1. Open FitMetrics → Settings → Sign In → Click "Continue as Guest"
2. ✅ Should close modal, set guest mode

---

## ⚠️ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "localhost" link in email | Supabase Redirect URLs not set → Step 1 |
| "invalid_client" on Google | Client Secret wrong → Step 2 |
| "redirect_uri_mismatch" | Google Cloud Console redirect URI not set → Step 3 |
| Google sign-in shows error | Android SHA-1 not added → Step 4 |
| App doesn't open from link | Deep link not configured → check app.json scheme + intentFilters |

---

## 📝 Summary Checklist

- [ ] Supabase Redirect URLs added (Step 1)
- [ ] Supabase Google Provider enabled (Step 2)
- [ ] Google Cloud Console Web Client redirect URI (Step 3)
- [ ] Google Cloud Console Android Client created (Step 4)
- [ ] Firebase SHA-1 fingerprint added (Step 5)
- [ ] App rebuilt and tested (Step 6)
