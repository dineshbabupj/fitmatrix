export interface NutritionFacts {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  image_url: string;
  nutrition: NutritionFacts;
}

export class OpenFoodFactsService {
  private static BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';

  /**
   * Fetch food product details by barcode
   * @param barcode The EAN/UPC barcode string
   * @returns FoodProduct object or null if not found
   */
  static async getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/${barcode}.json`);
      const data = await response.json();

      if (data.status !== 1 || !data.product) {
        console.warn(`[OpenFoodFacts] Product not found for barcode: ${barcode}`);
        return null;
      }

      const p = data.product;
      const nutriments = p.nutriments || {};

      // Fallback logic for nutrition parsing (Open Food Facts returns values per 100g usually,
      // but we try to grab the per serving value if available, else per 100g).
      const calories = nutriments['energy-kcal_serving'] || nutriments['energy-kcal_100g'] || 0;
      const protein = nutriments['proteins_serving'] || nutriments['proteins_100g'] || 0;
      const carbs = nutriments['carbohydrates_serving'] || nutriments['carbohydrates_100g'] || 0;
      const fat = nutriments['fat_serving'] || nutriments['fat_100g'] || 0;

      return {
        barcode,
        name: p.product_name || 'Unknown Product',
        brand: p.brands || 'Unknown Brand',
        image_url: p.image_url || '',
        nutrition: {
          calories: Math.round(calories),
          protein: Math.round(protein * 10) / 10,
          carbs: Math.round(carbs * 10) / 10,
          fat: Math.round(fat * 10) / 10,
        },
      };
    } catch (error) {
      console.error('[OpenFoodFacts] API Error:', error);
      return null;
    }
  }
}
