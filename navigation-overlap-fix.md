# Plan: Fix Navigation Menu Overlap (Safe Area Issue)

## 1. Problem Identification
Based on your screenshot, the mobile device's system navigation buttons (triangle, circle, square) are overlapping our app's bottom tab menu (`Home`, `Calculators`, `Progress`, `Settings`). 

This happens because in `app/(tabs)/_layout.tsx`, the tab bar has a **fixed height (`height: 60`)**. When we hardcode the height, the app ignores the Android device's "Safe Area Insets" (the bottom space reserved by the OS for system buttons), causing the overlap.

## 2. Proposed Code Fix

**File to modify:** `app/(tabs)/_layout.tsx`

**What we will do:**
1. Import `useSafeAreaInsets` from `react-native-safe-area-context`.
2. Get the bottom inset: `const insets = useSafeAreaInsets();`
3. Dynamically add this inset to the tab bar's height and bottom padding.
   ```javascript
   height: 60 + insets.bottom,
   paddingBottom: 8 + insets.bottom,
   ```
This will automatically push our navigation menu up, exactly above the system buttons, no matter what Android phone you use!

## 3. How to Update and Test the App

You asked: *"Do we have to rebuild in Expo again?"*

Yes and No. Here is the strategy:

### A. Quick Testing (No Rebuild Required)
Since this is only a UI change (JavaScript code), you do **not** need to wait for a 10-minute EAS build just to test it!
1. We will run `npx expo start` in the terminal.
2. You can open the **Expo Go** app on your phone and scan the QR code.
3. You can see the fix immediately on your phone.

### B. Updating the Google Play Testing Track (Rebuild Required)
Currently, our app doesn't have "Expo Updates" (Over-The-Air updates) installed. Therefore, to push this fix to the Google Play Internal Testing track, we **must**:
1. Run the EAS build command again (`eas build -p android --profile production`).
2. Download the new `.aab` (Version Code 4).
3. Upload it to Google Play Console.

## 4. Next Steps
- Review this plan. 
- If you approve, I will apply the code changes and we can quickly test it using Expo Go before running the final EAS build!
