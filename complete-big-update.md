# Complete "Big Update" Plan

Based on your request to finish the *entire* Big Update before doing an EAS build, here is the roadmap for the remaining features. We will build these step-by-step.

## 🎯 1. Rest Timer (UI & Logic)
**Goal:** Prevent users from spacing out between sets.
*   **What we will do:** Add a countdown timer at the top or bottom of the `new.tsx` workout screen.
*   **How it works:** When a user taps a "Checkmark" or finishes a set, a 60-second or 90-second timer starts automatically.

## 🎯 2. Per-Exercise History & Auto-Fill
**Goal:** Show previous performance to motivate the user and save typing.
*   **What we will do:** When a user adds an exercise (e.g., Squats), the app searches their past workouts.
*   **How it works:** 
    1. It displays: *"Last time: 3 sets of 60kg"* under the exercise name.
    2. It **auto-fills** the input boxes with those previous numbers (Automated Progression) so the user just has to tap "Save" if they lift the same weight!

## 🎯 3. Health Sync (Apple Health / Google Fit) ⚠️
**Goal:** Show steps and daily burned calories on the FitMetrics Dashboard.
*   **What we will do:** Integrate native health APIs.
*   **⚠️ CRITICAL WARNING:** Native Health APIs (like Google Health Connect) cannot run in the normal **Expo Go** app. To test this feature, we will have to stop using Expo Go and switch to **Expo Development Builds** (which requires creating a custom testing app via EAS). 

---

## 🛑 Phase 0: Socratic Gate (Your Decision Needed)

1. **Health Sync Complexity:** Are you okay with moving away from "Expo Go" to "Development Builds" for the Health Sync feature? (It takes a bit more setup time). Or should we skip Health Sync for now and focus purely on the Timer and Auto-fill features for this Big Update?
2. **Timer Duration:** What should be the default rest timer? (e.g., 60 seconds, 90 seconds, or let the user choose every time?).

---

## 📋 Next Steps
- Review this complete plan.
- Answer the 2 questions above.
- Run `/create` to start the implementation of the Timer and Auto-fill!
