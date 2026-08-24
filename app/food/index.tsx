import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { OpenFoodFactsService, FoodProduct } from '../../src/services/openFoodFacts';
import { useFoodStore } from '../../src/store/foodStore';

export default function FoodDashboardScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<FoodProduct | null>(null);
  const { logFood } = useFoodStore();

  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  // Auto-search by barcode if we navigate back from the scanner
  useEffect(() => {
    if (barcode) {
      setSearchQuery(barcode);
      handleSearch(barcode);
    }
  }, [barcode]);

  const handleSearch = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    setIsLoading(true);
    setSearchResult(null);
    
    const product = await OpenFoodFactsService.getProductByBarcode(barcode.trim());
    
    setSearchResult(product);
    setIsLoading(false);
  };

  const handleLogFood = () => {
    if (searchResult) {
      logFood(searchResult);
      // Optional: Add a success toast/alert here
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.dark.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Log</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.dark.outline} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search or enter barcode"
              placeholderTextColor={theme.colors.dark.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
            />
          </View>
          <TouchableOpacity 
            style={styles.scanBtn}
            onPress={() => router.push('/food/scanner')}
          >
            <Ionicons name="barcode-outline" size={24} color="#121212" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.dark.primary} />
            <Text style={styles.loadingText}>Fetching nutrition data...</Text>
          </View>
        ) : searchResult ? (
          <View style={styles.resultCard}>
            <Text style={styles.brandText}>{searchResult.brand}</Text>
            <Text style={styles.productName}>{searchResult.name}</Text>
            
            <View style={styles.macrosContainer}>
              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>{searchResult.nutrition.calories}</Text>
                <Text style={styles.macroLabel}>kcal</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>{searchResult.nutrition.protein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>{searchResult.nutrition.carbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>{searchResult.nutrition.fat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logBtn} onPress={handleLogFood}>
              <Ionicons name="add" size={20} color="#121212" />
              <Text style={styles.logBtnText}>Log this food</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <Ionicons name="nutrition-outline" size={48} color={theme.colors.dark.primary} />
            </View>
            <Text style={styles.emptyTitle}>Log your meals</Text>
            <Text style={styles.emptyDesc}>Scan a barcode or search to quickly log food and track your macros.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
  },
  content: {
    padding: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline + '40',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 56,
    color: theme.colors.dark.onSurface,
    fontSize: 16,
  },
  scanBtn: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.dark.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.dark.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  resultCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline + '40',
  },
  brandText: {
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 24,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  macroBox: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.dark.primary,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
  },
  logBtn: {
    backgroundColor: theme.colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  logBtnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
