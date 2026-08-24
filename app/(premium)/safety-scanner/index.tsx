import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { openFoodFactsService, FoodProductInfo } from '../../../src/services/api/openFoodFactsService';
import { theme } from '../../../src/theme/theme';

export default function SafetyScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Results
  const [product, setProduct] = useState<FoodProductInfo | null>(null);
  
  // Camera scanning modal
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarcodeSearch = async (codeToSearch?: string) => {
    const targetCode = codeToSearch || barcode.trim();
    if (!targetCode) {
      Alert.alert('Empty Code', 'Please enter or scan a barcode.');
      return;
    }

    setLoading(true);
    setProduct(null);
    try {
      const prod = await openFoodFactsService.getProductByBarcode(targetCode);
      if (prod) {
        setProduct(prod);
      } else {
        Alert.alert('Not Found', 'Product not found in Open Food Facts database.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      Alert.alert('Empty Query', 'Please enter a product name to search.');
      return;
    }

    setLoading(true);
    setProduct(null);
    try {
      const results = await openFoodFactsService.searchProducts(query);
      if (results && results.length > 0) {
        // Show first matched product
        setProduct(results[0]);
      } else {
        Alert.alert('Not Found', 'No matching products found.');
      }
    } catch (e) {
      Alert.alert('Error', 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannerVisible(false);
    setBarcode(data);
    handleBarcodeSearch(data);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Blocked', 'Camera permission is required to scan barcodes.');
        return;
      }
    }
    setScanned(false);
    setScannerVisible(true);
  };

  // Evaluate product safety parameters
  const evaluateSafety = (prod: FoodProductInfo) => {
    const warnings: string[] = [];
    let score: 'safe' | 'warning' | 'alert' = 'safe';

    // Check allergens
    if (prod.allergens && prod.allergens.length > 0) {
      warnings.push(`Contains allergens: ${prod.allergens.join(', ')}`);
      score = 'warning';
    }

    // Check high concern additives
    const badAdditives = ['e102', 'e110', 'e124', 'e129', 'e150', 'e951'];
    const foundBad = prod.additives?.filter(add => badAdditives.includes(add.toLowerCase())) || [];
    if (foundBad.length > 0) {
      warnings.push(`Contains artificial additives of concern: ${foundBad.join(', ').toUpperCase()}`);
      score = 'alert';
    }

    // Check ultra processed score
    if (prod.novagroup && prod.novagroup >= 4) {
      warnings.push('Ultra-processed food (NOVA Group 4). Consuming in moderation is advised.');
      if (score !== 'alert') score = 'warning';
    }

    return { score, warnings };
  };

  const safetyInfo = product ? evaluateSafety(product) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Allergen & Safety Scanner' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search / Entry Card */}
        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>Food Safety Scanner</Text>
          <Text style={styles.cardSubtitle}>Scan product barcodes or search ingredients to detect risks</Text>

          {/* Barcode Search / Scan */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="Enter Barcode manually"
              placeholderTextColor={theme.colors.dark.outline}
              value={barcode}
              onChangeText={setBarcode}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleBarcodeSearch()}>
              <Ionicons name="search" size={18} color={theme.colors.dark.onPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#4CAF50' }]} onPress={openCamera}>
              <Ionicons name="camera" size={18} color={theme.colors.dark.onPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          {/* Text Search */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="Search product by name"
              placeholderTextColor={theme.colors.dark.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.iconBtn} onPress={handleTextSearch}>
              <Ionicons name="search" size={18} color={theme.colors.dark.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loader */}
        {loading && <ActivityIndicator color={theme.colors.dark.primary} style={{ marginVertical: 40 }} />}

        {/* Safety Report Display */}
        {product && safetyInfo && (
          <View style={styles.reportContainer}>
            {/* Safety Banner */}
            <View
              style={[
                styles.safetyBanner,
                {
                  backgroundColor:
                    safetyInfo.score === 'alert'
                      ? '#E539351A'
                      : safetyInfo.score === 'warning'
                      ? '#FB8C001A'
                      : '#4CAF501A',
                  borderColor:
                    safetyInfo.score === 'alert'
                      ? '#E53935'
                      : safetyInfo.score === 'warning'
                      ? '#FB8C00'
                      : '#4CAF50',
                },
              ]}
            >
              <Ionicons
                name={
                  safetyInfo.score === 'alert'
                    ? 'alert-circle'
                    : safetyInfo.score === 'warning'
                    ? 'warning'
                    : 'checkmark-circle'
                }
                size={32}
                color={
                  safetyInfo.score === 'alert'
                    ? '#E53935'
                    : safetyInfo.score === 'warning'
                    ? '#FB8C00'
                    : '#4CAF50'
                }
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.safetyBannerTitle,
                    {
                      color:
                        safetyInfo.score === 'alert'
                          ? '#E53935'
                          : safetyInfo.score === 'warning'
                          ? '#FB8C00'
                          : '#4CAF50',
                    },
                  ]}
                >
                  {safetyInfo.score === 'alert'
                    ? 'CRITICAL WARNING'
                    : safetyInfo.score === 'warning'
                    ? 'ATTENTION REQUIRED'
                    : 'PRODUCT CONFIRMED SAFE'}
                </Text>
                <Text style={styles.safetyBannerSubtitle}>
                  {safetyInfo.warnings.length > 0
                    ? `${safetyInfo.warnings.length} safety warnings flagged`
                    : 'No harmful additives or allergens detected.'}
                </Text>
              </View>
            </View>

            {/* Product Card */}
            <View style={styles.productCard}>
              <View style={styles.productHeader}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.placeholderImg}>
                    <Ionicons name="fast-food-outline" size={24} color={theme.colors.dark.outline} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productBrand}>{product.brand || 'Generic Brand'}</Text>
                </View>
              </View>

              {/* Warnings List */}
              {safetyInfo.warnings.length > 0 && (
                <View style={styles.warningsBox}>
                  {safetyInfo.warnings.map((warn, idx) => (
                    <View key={idx} style={styles.warningItem}>
                      <Ionicons name="close-circle" size={16} color="#E53935" />
                      <Text style={styles.warningText}>{warn}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Additives & Allergens Grids */}
              <Text style={styles.sectionLabel}>Nutrition Details</Text>
              <View style={styles.macrosRow}>
                <View style={styles.macroTag}>
                  <Text style={styles.macroVal}>{product.calories} kcal</Text>
                  <Text style={styles.macroLbl}>Calories</Text>
                </View>
                <View style={styles.macroTag}>
                  <Text style={styles.macroVal}>{product.protein_g}g</Text>
                  <Text style={styles.macroLbl}>Protein</Text>
                </View>
                <View style={styles.macroTag}>
                  <Text style={styles.macroVal}>{product.carbs_g}g</Text>
                  <Text style={styles.macroLbl}>Carbs</Text>
                </View>
                <View style={styles.macroTag}>
                  <Text style={styles.macroVal}>{product.fats_g}g</Text>
                  <Text style={styles.macroLbl}>Fats</Text>
                </View>
              </View>

              {/* Additives List */}
              {product.additives && product.additives.length > 0 && (
                <View style={styles.tagSection}>
                  <Text style={styles.sectionLabel}>Additives Detected</Text>
                  <View style={styles.tagsContainer}>
                    {product.additives.map((add, idx) => (
                      <View key={idx} style={styles.addTag}>
                        <Text style={styles.addTagText}>{add.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Ingredients Text */}
              {product.ingredients && (
                <View style={styles.ingredientsBox}>
                  <Text style={styles.sectionLabel}>Ingredients List</Text>
                  <Text style={styles.ingredientsText}>{product.ingredients}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Camera Scanning Modal */}
      <Modal visible={scannerVisible} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
            }}
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setScannerVisible(false)}>
                <Ionicons name="close-circle" size={40} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.cameraScanFrame} />
              <Text style={styles.cameraHint}>Align barcode within the frame</Text>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  searchCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.dark.onSurface,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconBtn: {
    backgroundColor: theme.colors.dark.primary,
    width: 44,
    height: 44,
    borderRadius: theme.shapes.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.dark.outline,
  },
  reportContainer: {
    gap: 12,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    borderWidth: 1.5,
  },
  safetyBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  safetyBannerSubtitle: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  productCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  productImage: {
    width: 55,
    height: 55,
    borderRadius: 8,
  },
  placeholderImg: {
    width: 55,
    height: 55,
    borderRadius: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  productBrand: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  warningsBox: {
    backgroundColor: '#E5393510',
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    borderWidth: 1,
    borderColor: '#E5393555',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  macroTag: {
    flex: 1,
    backgroundColor: theme.colors.dark.surfaceVariant,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  macroVal: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  macroLbl: {
    fontSize: 9,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  tagSection: {
    marginBottom: theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  addTag: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  addTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.dark.onSurfaceVariant,
  },
  ingredientsBox: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginTop: theme.spacing.xs,
  },
  ingredientsText: {
    fontSize: 12,
    color: theme.colors.dark.onSurface,
    lineHeight: 18,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCameraBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  cameraScanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2.5,
    borderColor: theme.colors.dark.primary,
    borderRadius: 16,
  },
  cameraHint: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
  },
});
