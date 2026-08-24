import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { openFoodFactsService, FoodProductInfo } from '../../../src/services/api/openFoodFactsService';
import { theme } from '../../../src/theme/theme';

export default function AlternativeAdvisorScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<FoodProductInfo[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<FoodProductInfo | null>(null);

  // Alternatives state
  const [alternatives, setAlternatives] = useState<FoodProductInfo[]>([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      Alert.alert('Empty Query', 'Please enter a grocery product to search.');
      return;
    }

    setLoading(true);
    setProducts([]);
    setSelectedProduct(null);
    setAlternatives([]);

    try {
      const results = await openFoodFactsService.searchProducts(q);
      if (results && results.length > 0) {
        setProducts(results);
      } else {
        Alert.alert('No Results', 'No grocery products found.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to query database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (prod: FoodProductInfo) => {
    setSelectedProduct(prod);
    setProducts([]); // Clear list to show selected detail and alternatives
    setAlternatives([]);
    setAlternativesLoading(true);

    try {
      // Find the first valid category tag (avoiding very generic tags like 'en:food')
      const validCategory = prod.categories?.find(
        (cat) => !['en:food', 'en:beverages', 'en:groceries'].includes(cat.toLowerCase())
      );

      if (validCategory) {
        const potentialAlts = await openFoodFactsService.searchProductsByCategory(validCategory);
        
        // Filter out original product, and keep only items with better Nutri-Score (a, b, c)
        const currentScore = prod.nutriscore?.toLowerCase() || 'e';
        const scoreRank = (score: string) => ['a', 'b', 'c', 'd', 'e'].indexOf(score);
        
        const filtered = potentialAlts.filter((alt) => {
          if (alt.barcode === prod.barcode) return false;
          const altScore = alt.nutriscore?.toLowerCase();
          if (!altScore) return false;
          
          // Better Nutri-Score than original product
          return scoreRank(altScore) < scoreRank(currentScore);
        });

        // Take top 3 alternatives
        setAlternatives(filtered.slice(0, 3));
      } else {
        // No specific category found, fallback
        setAlternatives([]);
      }
    } catch (e) {
      console.warn('Failed to load alternatives:', e);
    } finally {
      setAlternativesLoading(false);
    }
  };

  const getNutriscoreColor = (grade?: string) => {
    const g = grade?.toLowerCase() || 'unknown';
    switch (g) {
      case 'a': return '#038141';
      case 'b': return '#85BB2F';
      case 'c': return '#FEC902';
      case 'd': return '#EE8100';
      case 'e': return '#E63E11';
      default: return theme.colors.dark.outline;
    }
  };

  const getNovaColor = (group?: number) => {
    switch (group) {
      case 1: return '#4CAF50';
      case 2: return '#FFC107';
      case 3: return '#FF9800';
      case 4: return '#E53935';
      default: return theme.colors.dark.outline;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Supermarket Alternatives' }} />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search grocery item (e.g. granola, soda)"
          placeholderTextColor={theme.colors.dark.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.colors.dark.onPrimary} size="small" />
          ) : (
            <Ionicons name="search" size={18} color={theme.colors.dark.onPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Results Search List */}
        {products.length > 0 && (
          <View style={styles.resultsList}>
            <Text style={styles.sectionTitle}>Select Food Item</Text>
            {products.map((prod) => (
              <TouchableOpacity
                key={prod.barcode}
                style={styles.productSearchCard}
                onPress={() => handleSelectProduct(prod)}
                activeOpacity={0.8}
              >
                {prod.imageUrl ? (
                  <Image source={{ uri: prod.imageUrl }} style={styles.productSearchImage} />
                ) : (
                  <View style={styles.placeholderSearchImg}>
                    <Ionicons name="basket-outline" size={18} color={theme.colors.dark.outline} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.productSearchName}>{prod.name}</Text>
                  <Text style={styles.productSearchBrand}>{prod.brand || 'Generic Brand'}</Text>
                </View>
                {prod.nutriscore && (
                  <View style={[styles.miniScoreBadge, { backgroundColor: getNutriscoreColor(prod.nutriscore) }]}>
                    <Text style={styles.miniScoreText}>{prod.nutriscore.toUpperCase()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Product Comparison View */}
        {selectedProduct && (
          <View style={styles.comparisonContainer}>
            {/* Target Product Details */}
            <View style={styles.targetProductCard}>
              <Text style={styles.cardHeaderLabel}>Current Selection</Text>
              
              <View style={styles.targetMainInfo}>
                {selectedProduct.imageUrl ? (
                  <Image source={{ uri: selectedProduct.imageUrl }} style={styles.targetImage} />
                ) : (
                  <View style={styles.targetPlaceholderImg}>
                    <Ionicons name="fast-food" size={32} color={theme.colors.dark.outline} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.targetName}>{selectedProduct.name}</Text>
                  <Text style={styles.targetBrand}>{selectedProduct.brand || 'Generic Brand'}</Text>
                  
                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    {selectedProduct.nutriscore && (
                      <View style={[styles.scoreBadge, { backgroundColor: getNutriscoreColor(selectedProduct.nutriscore) }]}>
                        <Text style={styles.scoreBadgeLabel}>Nutri-Score</Text>
                        <Text style={styles.scoreBadgeValue}>{selectedProduct.nutriscore.toUpperCase()}</Text>
                      </View>
                    )}
                    {selectedProduct.novagroup && (
                      <View style={[styles.scoreBadge, { backgroundColor: getNovaColor(selectedProduct.novagroup) }]}>
                        <Text style={styles.scoreBadgeLabel}>NOVA Group</Text>
                        <Text style={styles.scoreBadgeValue}>{selectedProduct.novagroup}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Alternatives Title */}
            <Text style={styles.sectionTitle}>Healthy Alternatives Suggested</Text>

            {alternativesLoading ? (
              <ActivityIndicator color={theme.colors.dark.primary} style={{ marginVertical: 30 }} />
            ) : alternatives.length > 0 ? (
              <View style={styles.alternativesList}>
                {alternatives.map((alt) => (
                  <View key={alt.barcode} style={styles.altCard}>
                    {alt.imageUrl ? (
                      <Image source={{ uri: alt.imageUrl }} style={styles.altImage} />
                    ) : (
                      <View style={styles.altPlaceholderImg}>
                        <Ionicons name="nutrition" size={24} color={theme.colors.dark.outline} />
                      </View>
                    )}
                    <View style={styles.altInfo}>
                      <Text style={styles.altName} numberOfLines={1}>{alt.name}</Text>
                      <Text style={styles.altBrand} numberOfLines={1}>{alt.brand || 'Generic'}</Text>
                      
                      {/* Macro comparison snippet */}
                      <Text style={styles.altMacros}>
                        🔥 {alt.calories} kcal  |  🥩 P: {alt.protein_g}g
                      </Text>
                    </View>
                    
                    <View style={styles.altScoreContainer}>
                      {alt.nutriscore && (
                        <View style={[styles.miniScoreBadgeBig, { backgroundColor: getNutriscoreColor(alt.nutriscore) }]}>
                          <Text style={styles.miniScoreTextBig}>{alt.nutriscore.toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.betterBadgeText}>BETTER</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              /* Fallback suggestion box */
              <View style={styles.fallbackBox}>
                <Ionicons name="leaf-outline" size={32} color="#4CAF50" />
                <Text style={styles.fallbackTitle}>Healthy Substitute Tip</Text>
                <Text style={styles.fallbackText}>
                  Try exchanging highly processed options with organic whole fruits, home-prepared snacks, or simple unsalted nuts.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.resetBtn} onPress={() => {
              setSelectedProduct(null);
              setAlternatives([]);
            }}>
              <Text style={styles.resetBtnText}>Search Another Item</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  searchBarContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.dark.surface,
    borderBottomWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    paddingHorizontal: 12,
    color: theme.colors.dark.onSurface,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#333',
  },
  searchBtn: {
    backgroundColor: theme.colors.dark.primary,
    width: 44,
    height: 44,
    borderRadius: theme.shapes.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  resultsList: {
    gap: 8,
  },
  productSearchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.shapes.medium,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 12,
  },
  productSearchImage: {
    width: 45,
    height: 45,
    borderRadius: 6,
  },
  placeholderSearchImg: {
    width: 45,
    height: 45,
    borderRadius: 6,
    backgroundColor: theme.colors.dark.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productSearchName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  productSearchBrand: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  miniScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  miniScoreText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  comparisonContainer: {
    gap: 12,
  },
  targetProductCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    borderWidth: 1,
    borderColor: '#E5393544',
  },
  cardHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E53935',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  targetMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  targetImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  targetPlaceholderImg: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  targetBrand: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  scoreBadgeValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
  },
  alternativesList: {
    gap: 10,
  },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.shapes.medium,
    borderWidth: 1.5,
    borderColor: '#4CAF5055',
    gap: 12,
  },
  altImage: {
    width: 55,
    height: 55,
    borderRadius: 8,
  },
  altPlaceholderImg: {
    width: 55,
    height: 55,
    borderRadius: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  altName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  altBrand: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  altMacros: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.dark.primary,
    marginTop: 4,
  },
  altScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 6,
  },
  miniScoreBadgeBig: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniScoreTextBig: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  betterBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#4CAF50',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  fallbackBox: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    gap: 8,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4CAF50',
  },
  fallbackText: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: theme.shapes.medium,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  resetBtnText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
});
