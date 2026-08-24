# Deploy FitMetrics to Play Console Closed Testing

## Goal
Upload updated build (with monetization features) to Play Console, test on real device.

## Tasks

- [ ] **Task 1: EAS Login** → Run `cd fitmetrics-expo && npx eas login` with Expo credentials → Verify: `npx eas whoami` returns username
- [ ] **Task 2: Build release AAB** → Run `npx eas build --platform android --profile production` → Verify: `.aab` file generated, build URL shown
- [ ] **Task 3: Upload to Play Console** → Open Play Console → Testing → Closed testing → Manage track → Create release → Upload AAB → Verify: Build uploaded, status "Pending"
- [ ] **Task 4: Wait for processing** → Play Console processes build (1-3 hours) → Verify: Build status changes to "Available"
- [ ] **Task 5: Tester updates app** → Opted-in tester opens Play Store → Taps "Update" → Verify: App installs successfully
- [ ] **Task 6: Test Home screen** → Open app → Verify: Progress cards, gold Pro upsell card, banner ad placeholder
- [ ] **Task 7: Test PaywallModal** → Tap Pro upsell → Verify: 4 plans shown (Monthly $4.99, Yearly $29.99, Lifetime $79.99, Remove Ads $4.99)
- [ ] **Task 8: Test Calculators** → Tap BMR, Body Fat, TDEE, Macros, 1RM → Verify: All load, interstitial ads every 3rd calc
- [ ] **Task 9: Test Settings** → Navigate to Settings → Verify: Pro upgrade card visible
- [ ] **Task 10: Check crash reports** → Play Console → Testing → Closed testing → Reports → Verify: No crashes from new build

## Done When
- Tester confirms app works with all monetization features
- No crash reports in Play Console

## Notes
- AdMob: Using test ads (`USE_PRODUCTION_ADS = false`) for safety
- AdMob test App ID in manifest: `ca-app-pub-3940256099942544~3347511713`
- RevenueCat: Products + entitlements + offerings already configured
- Real AdMob App ID needed before switching to production ads
- Switch `USE_PRODUCTION_ADS = true` only after testing confirms ads work
