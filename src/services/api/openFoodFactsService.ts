export interface FoodProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  imageUrl?: string;
  // Premium properties
  nutriscore?: string;
  novagroup?: number;
  allergens?: string[];
  additives?: string[];
  ingredients?: string;
  categories?: string[];
}

class OpenFoodFactsService {
  /**
   * Fetch food product details by barcode using Open Food Facts API v3
   */
  public async getProductByBarcode(barcode: string): Promise<FoodProductInfo | null> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;

    const fields = 'product_name,brands,nutriments,image_front_small_url,nutriscore_grade,nova_group,allergens_tags,additives_tags,ingredients_text,categories_tags';
    const url = `https://world.openfoodfacts.org/api/v3/product/${cleanBarcode}?fields=${fields}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FitMetricsApp - Android/iOS - Version 1.2.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.status !== 'success' || !data.product) {
        return null;
      }

      const p = data.product;
      const n = p.nutriments || {};

      // Parse calories (energy-kcal_100g or energy-kcal_serving)
      const calories = Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0);
      const protein_g = Math.round((n['proteins_100g'] || n['proteins'] || 0) * 10) / 10;
      const carbs_g = Math.round((n['carbohydrates_100g'] || n['carbohydrates'] || 0) * 10) / 10;
      const fats_g = Math.round((n['fat_100g'] || n['fat'] || 0) * 10) / 10;

      // Additives clean-up (remove en: prefix)
      const cleanList = (tags: string[]) => 
        tags ? tags.map(t => t.replace(/^(en|fr|es):/, '')).filter(Boolean) : [];

      return {
        barcode: cleanBarcode,
        name: p.product_name || 'Unknown Food Item',
        brand: p.brands || undefined,
        calories,
        protein_g,
        carbs_g,
        fats_g,
        imageUrl: p.image_front_small_url || undefined,
        nutriscore: p.nutriscore_grade || undefined,
        novagroup: p.nova_group ? Number(p.nova_group) : undefined,
        allergens: cleanList(p.allergens_tags),
        additives: cleanList(p.additives_tags),
        ingredients: p.ingredients_text || undefined,
        categories: p.categories_tags || [],
      };
    } catch (error) {
      console.warn('[OpenFoodFactsService] Barcode lookup error:', error);
      return null;
    }
  }

  /**
   * Searches Open Food Facts by category tag and returns popular products
   */
  public async searchProductsByCategory(categoryTag: string): Promise<FoodProductInfo[]> {
    if (!categoryTag) return [];

    const fields = 'code,product_name,brands,nutriments,image_front_small_url,nutriscore_grade,nova_group,allergens_tags,additives_tags,ingredients_text,categories_tags';
    const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(categoryTag)}&fields=${fields}&sort_by=popularity&page_size=20`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FitMetricsApp - Android/iOS - Version 1.2.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const products = data.products || [];

      return products.map((p: any) => {
        const n = p.nutriments || {};
        const calories = Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0);
        const protein_g = Math.round((n['proteins_100g'] || n['proteins'] || 0) * 10) / 10;
        const carbs_g = Math.round((n['carbohydrates_100g'] || n['carbohydrates'] || 0) * 10) / 10;
        const fats_g = Math.round((n['fat_100g'] || n['fat'] || 0) * 10) / 10;

        const cleanList = (tags: string[]) => 
          tags ? tags.map(t => t.replace(/^(en|fr|es):/, '')).filter(Boolean) : [];

        return {
          barcode: p.code || '',
          name: p.product_name || 'Unknown Food Item',
          brand: p.brands || undefined,
          calories,
          protein_g,
          carbs_g,
          fats_g,
          imageUrl: p.image_front_small_url || undefined,
          nutriscore: p.nutriscore_grade || undefined,
          novagroup: p.nova_group ? Number(p.nova_group) : undefined,
          allergens: cleanList(p.allergens_tags),
          additives: cleanList(p.additives_tags),
          ingredients: p.ingredients_text || undefined,
          categories: p.categories_tags || [],
        };
      });
    } catch (error) {
      console.error('[OpenFoodFactsService] Category search error:', error);
      return [];
    }
  }

  /**
   * General text search for food items on Open Food Facts
   */
  public async searchProducts(query: string): Promise<FoodProductInfo[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const fields = 'code,product_name,brands,nutriments,image_front_small_url,nutriscore_grade,nova_group,allergens_tags,additives_tags,ingredients_text,categories_tags';
    const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(cleanQuery)}&fields=${fields}&sort_by=popularity&page_size=20`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FitMetricsApp - Android/iOS - Version 1.2.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const products = data.products || [];

      return products.map((p: any) => {
        const n = p.nutriments || {};
        const calories = Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0);
        const protein_g = Math.round((n['proteins_100g'] || n['proteins'] || 0) * 10) / 10;
        const carbs_g = Math.round((n['carbohydrates_100g'] || n['carbohydrates'] || 0) * 10) / 10;
        const fats_g = Math.round((n['fat_100g'] || n['fat'] || 0) * 10) / 10;

        const cleanList = (tags: string[]) => 
          tags ? tags.map(t => t.replace(/^(en|fr|es):/, '')).filter(Boolean) : [];

        return {
          barcode: p.code || '',
          name: p.product_name || 'Unknown Food Item',
          brand: p.brands || undefined,
          calories,
          protein_g,
          carbs_g,
          fats_g,
          imageUrl: p.image_front_small_url || undefined,
          nutriscore: p.nutriscore_grade || undefined,
          novagroup: p.nova_group ? Number(p.nova_group) : undefined,
          allergens: cleanList(p.allergens_tags),
          additives: cleanList(p.additives_tags),
          ingredients: p.ingredients_text || undefined,
          categories: p.categories_tags || [],
        };
      });
    } catch (error) {
      console.error('[OpenFoodFactsService] Text search error:', error);
      return [];
    }
  }
}

export const openFoodFactsService = new OpenFoodFactsService();
