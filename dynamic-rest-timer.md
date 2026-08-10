# Plan: Dynamic Rest Timer

Based on your question "Which is best?", the absolute best approach for a premium fitness app (like Strong or Hevy) is **Option 2: Exercise-Specific Rest Time with Auto-Save**.

## Why is it the best?
If you always take 90 விநாடிகள் (seconds) rest for Squats, it is annoying to manually press the "90s" button *every single time* you finish a set. The app should be smart enough to remember your preference for that specific exercise.

## How it will work (The Logic)

### 1. Store Rest Time per Exercise
We will add a new field `restTime` to our `Exercise` data model. By default, it will be 60s.

### 2. UI for Changing Time
In the Workout Builder (`new.tsx`), next to the exercise name, we will show a small chip: ⏱️ `60s`. 
If you click it, you can change it to `90s`, `120s`, etc.

### 3. Smart Memory (Auto-Fill)
Since we already built the "Auto-Fill" system in Phase 2, when you add "Squats" tomorrow, the app will look at your history, see that you used `90s` rest time last time, and automatically set the rest timer to `90s` for Squats!

### 4. Timer Component Update
When you click the "Checkmark" to complete a set, the `RestTimer` will pop up starting from the specific `restTime` of that exercise (not a hardcoded 60s).

---

## Technical Breakdown (For the AI)
- **`workoutStore.ts`**: Update `Exercise` interface to include `restTime?: number`.
- **`new.tsx`**: Add a UI element (e.g., a small TouchableOpacity next to the exercise name) to select rest time (30s, 60s, 90s, 120s, 180s).
- **`new.tsx`**: When `handleToggleComplete` is triggered, pass `exercise.restTime || 60` to the `RestTimer` component state.

---

## 🛑 Phase 0: Socratic Gate
This is the most professional way to build it. Do you approve this smart "Auto-Saving Rest Timer" plan? 
If yes, just reply with `/create` and I will implement it!
