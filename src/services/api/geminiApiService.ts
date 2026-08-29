const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';


export interface SpoonacularMeal {
  id: number;
  title: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  image?: string;
}

export interface DayPlan {
  meals: SpoonacularMeal[];
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
}

export interface WeekPlan {
  [day: string]: DayPlan;
}

export interface ParsedIngredient {
  original: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

class GeminiApiService {
  /**
   * Generates a 7-day meal plan from Gemini based on target calories and diet
   */
  public async generateMealPlan(targetCalories: number, diet?: string): Promise<WeekPlan | null> {
    if (!GEMINI_API_KEY) {
      console.warn('[GeminiApiService] API Key is missing. Add EXPO_PUBLIC_GEMINI_API_KEY to .env');
      return null;
    }

    const dietStr = diet && diet.toLowerCase() !== 'any' ? diet : 'balanced';

    const prompt = `You are an expert nutritionist. Generate a 7-day meal plan (monday through sunday) for a ${dietStr} diet with a target of ${targetCalories} calories per day.

You must reply with ONLY a raw JSON object (no markdown formatting, no \`\`\`json blocks) that strictly matches this exact TypeScript interface:
interface WeekPlan {
  [day: string]: {
    meals: Array<{
      id: number; // Generate a random 6 digit integer
      title: string; // The name of the meal
      readyInMinutes: number; // Estimated prep/cook time
      servings: number; // Always 1
      sourceUrl: string; // Just put "https://example.com"
      image: string; // Provide a relevant unsplash image URL like "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80" matching the food
    }>;
    nutrients: {
      calories: number;
      protein: number; // in grams
      fat: number; // in grams
      carbohydrates: number; // in grams
    };
  }
}
Make sure each day has exactly 3 meals (breakfast, lunch, dinner). The days of the week should be lowercase (e.g. "monday", "tuesday", etc).`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        console.error('[GeminiApiService] Response error:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        console.error('[GeminiApiService] No content returned from Gemini.');
        return null;
      }

      const parsedPlan: WeekPlan = JSON.parse(contentText);
      return parsedPlan;

    } catch (error) {
      console.error('[GeminiApiService] Error generating meal plan:', error);
      return null;
    }
  }

  /**
   * Parses natural language text of ingredients into structured nutrients using Gemini
   */
  public async parseIngredients(ingredientsText: string): Promise<ParsedIngredient[] | null> {
    if (!GEMINI_API_KEY || !ingredientsText.trim()) return null;

    const prompt = `You are a nutrition database parser. A user has logged the following food text: "${ingredientsText}".
Extract all distinct food items from this text and estimate their macronutrients.

You must reply with ONLY a raw JSON array (no markdown formatting, no \`\`\`json blocks) that strictly matches this exact TypeScript interface:
Array<{
  original: string; // The original text chunk describing this item
  name: string; // Cleaned up name of the food
  amount: number; // Estimated numeric amount (e.g., 2)
  unit: string; // Unit (e.g., "eggs", "cups", "grams")
  calories: number; // Estimated calories
  protein: number; // Estimated protein in grams
  carbs: number; // Estimated carbs in grams
  fat: number; // Estimated fat in grams
}>`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        console.error('[GeminiApiService] Parse ingredients error status:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        console.error('[GeminiApiService] No content returned from Gemini.');
        return null;
      }

      const parsedIngredients: ParsedIngredient[] = JSON.parse(contentText);
      return parsedIngredients;

    } catch (error) {
      console.error('[GeminiApiService] Parse ingredients exception:', error);
      return null;
    }
  }
}

export const geminiApiService = new GeminiApiService();
