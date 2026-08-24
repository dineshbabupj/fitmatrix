# FitMetrics — Closed Testing v2 Update Plan

## Goal
Fix all bugs, complete missing features, and rebuild for the next closed testing version.

## ✅ Already Done (No action needed)

| # | Item | Status |
|---|------|--------|
| 1 | Navigation overlap (SafeAreaInsets) | ✅ Fixed in `_layout.tsx` |
| 2 | Auth redirect URLs (`fitmetrics://`) | ✅ Fixed in `authRedirects.ts` |
| 3 | Google Client ID mismatch | ✅ Supabase + App synced to Firebase project |
| 4 | Deep link handler | ✅ `supabaseClient.ts` + `_layout.tsx` |
| 5 | PDF Export | ✅ `pdfExportService.ts` working |
| 6 | AdMob production ad units | ✅ `adMobConfig.ts` has real IDs |
| 7 | RevenueCat IAP | ✅ Configured with API keys |
| 8 | TypeScript | ✅ 0 errors |
| 9 | Unit tests | ✅ 264/264 passing |
| 10 | Real auth integration tests | ✅ 20/20 passing |
| 11 | Supabase redirect URLs | ✅ Configured via Management API |
| 12 | Supabase Google Provider | ✅ Enabled + correct Client ID |

---

## 🔴 Critical — Must Fix Before Build

### Task 1: Push Notification Scheduling Service
**What:** Create a notification service for workout reminders + water reminders.
**Why:** `expo-notifications` is installed but NO scheduling service exists.
**Files to create/modify:**
- `src/services/notifications/notificationService.ts` (NEW)
- `app/_layout.tsx` (add permission request)

**Verify:** `npx jest src/__tests__/notificationService.test.ts` passes

---

### Task 2: Fix AdMob Fallback for Expo Go
**What:** Current AdMob falls back to `Alert.alert()` as mock ad. This is ugly in production.
**Why:** When real ads fail to load, users see "Sponsor Message" alerts.
**Files to modify:**
- `src/services/admob/adMobManager.ts` (graceful fallback)

**Verify:** No Alert.alert fallback in production — just skip ad silently

---

### Task 3: Version Bump
**What:** Update `app.json` version to 1.4.0, `versionCode` to 32.
**Why:** New build needs new version for Play Store.
**Files to modify:**
- `app.json` (version + versionCode)

**Verify:** `app.json` shows version 1.4.0

---

## 🟡 Important — Should Fix Before Build

### Task 4: Clean Up `.env` — Remove Development Keys
**What:** Remove hardcoded API keys from source code.
**Why:** Security — keys should be in `.env` only, not hardcoded as fallbacks.
**Files to modify:**
- `src/services/auth/supabaseAuthService.ts` (remove hardcoded Client ID fallback)
- `src/services/iap/iapConfig.ts` (remove demo API key)

**Verify:** `grep -r "appl_FitMetricsDemo" src/` returns 0 results

---

### Task 5: Add Error Boundary
**What:** Wrap root layout in ErrorBoundary so crashes show friendly UI.
**Why:** App crashes in production show white screen — no recovery.
**Files to modify:**
- `app/_layout.tsx` (wrap with ErrorBoundary)

**Verify:** `npx tsc --noEmit` passes

---

## 🟢 Nice to Have — Can Do Later

### Task 6: Fix Maestro E2E Device Detection
**What:** Maestro 1.39 can't detect emulator on this Windows setup.
**Why:** Maestro E2E tests can't run.
**Status:** Can't fix — known Maestro Windows issue. Skip for now.

---

## ⚠️ Manual Steps (Unga Side)

These require browser access — I can't automate them:

| # | Task | Where |
|---|------|-------|
| M1 | Google Cloud Console → Add Supabase callback URL | https://console.cloud.google.com/apis/credentials |
| M2 | Rebuild app with `eas build -p android --profile production` | Terminal |
| M3 | Upload AAB to Play Console closed testing | https://play.google.com/console |
| M4 | Test Google Login on real device | Device |

---

## 📊 Summary

| Category | Count |
|----------|-------|
| ✅ Already Done | 12 |
| 🔴 Must Fix | 3 |
| 🟡 Should Fix | 2 |
| 🟢 Skip for Now | 1 |
| ⚠️ Manual (Unga Side) | 4 |

## Done When
- [ ] All 3 critical tasks complete
- [ ] All 2 important tasks complete
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx jest` → all tests pass
- [ ] EAS build successful
- [ ] App uploaded to Play Console
