import { exerciseDb, Exercise } from '../../data/db';

const WGER_API_URL = 'https://wger.de/api/v2/exerciseinfo/?limit=60&language=2';

// Default static fallback exercises with visual GIF animations & Home vs Gym classification
export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'def_1',
    name: 'Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
    description: 'Lie flat on bench, lower bar to mid-chest with elbows at 45 degrees, press up firmly to full extension.',
    muscle_group: 'Chest, Triceps, Front Delts',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0025.gif',
    workout_type: 'Gym',
    is_custom: 0,
    created_at: 1700000000000,
  },
  {
    id: 'def_2',
    name: 'Barbell Back Squat',
    category: 'Legs',
    equipment: 'Barbell',
    description: 'Bar on upper traps, bend knees until thighs parallel to ground, drive through heels to stand.',
    muscle_group: 'Quadriceps, Glutes, Hamstrings',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0043.gif',
    workout_type: 'Gym',
    is_custom: 0,
    created_at: 1700000000000,
  },
  {
    id: 'def_3',
    name: 'Conventional Deadlift',
    category: 'Back',
    equipment: 'Barbell',
    description: 'Hinge at hips with flat back, grip bar outside legs, extend hips and knees to lock out vertically.',
    muscle_group: 'Lats, Erector Spinae, Glutes, Hamstrings',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0032.gif',
    workout_type: 'Gym',
    is_custom: 0,
    created_at: 1700000000000,
  },
  {
    id: 'def_4',
    name: 'Overhead Shoulder Press',
    category: 'Shoulders',
    equipment: 'Barbell',
    description: 'Press bar overhead from collarbone height until arms lock out directly overhead.',
    muscle_group: 'Deltoids, Upper Chest, Triceps',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0041.gif',
    workout_type: 'Gym',
    is_custom: 0,
    created_at: 1700000000000,
  },
  {
    id: 'def_5',
    name: 'Pull-Up',
    category: 'Back',
    equipment: 'Bodyweight',
    description: 'Overhand wide grip on bar, pull chest to bar, lower under control until arms fully extend.',
    muscle_group: 'Lats, Biceps, Core',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0652.gif',
    workout_type: 'Home',
    is_custom: 0,
    created_at: 1700000000000,
  },
  {
    id: 'def_6',
    name: 'Dumbbell Bicep Curl',
    category: 'Arms',
    equipment: 'Dumbbell',
    description: 'Stand tall with dumbbells, flex elbows without swinging shoulders, squeeze biceps at top.',
    muscle_group: 'Biceps, Forearms',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0294.gif',
    workout_type: 'Home',
    is_custom: 0,
    created_at: 1700000000000,
  },
  {
    id: 'def_7',
    name: 'Push-Up',
    category: 'Chest',
    equipment: 'Bodyweight',
    description: 'Plank position with straight torso, lower chest until touching floor, press up explosively.',
    muscle_group: 'Chest, Triceps, Core',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0662.gif',
    workout_type: 'Home',
    is_custom: 0,
    created_at: 1700000000000,
  },
  {
    id: 'def_8',
    name: 'Hanging Leg Raise',
    category: 'Core',
    equipment: 'Bodyweight',
    description: 'Hang from pull-up bar, raise straight legs to 90 degrees using abdominal contraction.',
    muscle_group: 'Abs, Hip Flexors',
    gif_url: 'https://raw.githubusercontent.com/yuhas/free-exercise-db/main/gifs/0472.gif',
    workout_type: 'Home',
    is_custom: 0,
    created_at: 1700000000000,
  },
];

class WgerService {
  /**
   * Fetch exercises from wger API. If network fails, return cached exercises from SQLite.
   */
  public async getExercises(category?: string): Promise<Exercise[]> {
    try {
      const response = await fetch(WGER_API_URL, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          const apiExercises: Exercise[] = data.results.map((item: any) => ({
            id: `wger_${item.id}`,
            name: item.name || 'Unnamed Exercise',
            category: item.category?.name || 'General',
            equipment: item.equipment?.[0]?.name || 'Standard',
            description: item.description?.replace(/<[^>]*>?/gm, '') || '',
            muscle_group: item.muscles?.[0]?.name || item.category?.name || 'Full Body',
            is_custom: 0,
            created_at: Date.now(),
          }));

          // Cache batch to SQLite for offline resilience
          await exerciseDb.saveBatch([...DEFAULT_EXERCISES, ...apiExercises]);
        }
      }
    } catch (e) {
      console.warn('[WgerService] Network request failed. Using offline cached exercises:', e);
    }

    // Always fetch from local DB (which will have API results + default fallback)
    const local = await exerciseDb.getAll(category);
    if (local.length === 0) {
      // Seed default exercises into SQLite if DB is completely empty
      await exerciseDb.saveBatch(DEFAULT_EXERCISES);
      return category
        ? DEFAULT_EXERCISES.filter((ex) => ex.category === category)
        : DEFAULT_EXERCISES;
    }

    return local;
  }

  /**
   * Search exercises by query string
   */
  public async searchExercises(query: string): Promise<Exercise[]> {
    if (!query.trim()) return this.getExercises();

    const results = await exerciseDb.search(query.trim());
    if (results.length > 0) return results;

    // Filter defaults if search returned nothing
    const q = query.toLowerCase();
    return DEFAULT_EXERCISES.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.muscle_group?.toLowerCase().includes(q)
    );
  }
}

export const wgerService = new WgerService();
