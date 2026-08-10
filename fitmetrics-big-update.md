# FitMetrics 2.0: The "Big Update" Plan

Based on the Reddit insights, building *everything* at once is impossible and will bloat the app. Instead, we will divide the "Big Update" into strategic phases that align with what users actually want: **Speed, Simplicity, and Automation**.

---

## 🎯 Phase 1: Core Workout Logging & Rest Timers (High Priority)
Currently, FitMetrics focuses on Body Composition (Calculators). The natural next step is Workout Tracking.
*   **Quick / Notes-First Logging:** Instead of a complex UI, give users a simple text box where they can type: `"Bench Press 3x10 60kg"`. The app automatically parses this into structured data. *(Redditors love "capture-first" UX).*
*   **Rest Timers:** A simple countdown timer that starts automatically when a set is logged, with a push notification when rest is over.
*   **Per-Exercise History:** When logging an exercise, instantly show a small chart or text of their last 3 sessions for that specific exercise.

## 🎯 Phase 2: Device & Health Sync (Medium Priority)
Since the app is called "FitMetrics", data integration is crucial.
*   **Apple Health & Google Fit (Health Connect) Integration:** Automatically pull in Steps, Active Calories, and Sleep data to display on the FitMetrics Dashboard alongside their BMI/BMR data. 

## 🎯 Phase 3: Automated Progression (Advanced)
*   **Auto-suggest next weights:** If a user hit 3x10 easily last week, the app automatically suggests adding 2.5kg for today's session.

---

## 🛑 Phase 0: Socratic Gate (Your Decisions Needed!)

Before we write any code, we need to decide the exact scope of this Big Update. Please answer the following:

1. **Focus Area:** Do you want to start with **Workout Logging (Sets/Reps)** OR **Nutrition Tracking (Calories/Macros)** for this update? (Doing both at once is too big).
2. **UX Style:** Do you prefer a **"Notes-First"** approach (user types freely and we parse it) OR a **"Structured Builder"** approach (user selects exercise from a list, then clicks '+' to add sets)?
3. **Database:** Workout logging requires complex data relations. Should we continue using local storage (`AsyncStorage`/`SQLite`), or is it time to connect a backend like **Firebase/Supabase** so users don't lose their workout data?

---

## 📋 Verification & Next Steps
- Review the options above.
- Answer the 3 questions.
- Once decided, run `/create` (or just tell me to start) to begin Phase 1 implementation!
