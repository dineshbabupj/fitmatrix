import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useMealStore } from '../store/mealStore';
import { openFoodFactsService } from '../services/api/openFoodFactsService';
import { revenueCatService } from '../services/iap/revenueCatService';
import { PaywallModal } from './PaywallModal';

interface MealTrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MealTrackerModal: React.FC<MealTrackerModalProps> = ({ visible, onClose }) => {
  const { addMeal, todayDate } = useMealStore();
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanning, setScanning] = useState(false);

  const [paywallVisible, setPaywallVisible] = useState(false);

  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) return;

    // Check if Pro for Barcode feature
    const hasPro = await revenueCatService.hasProAccess();
    if (!hasPro) {
      setPaywallVisible(true);
      return;
    }

    setScanning(true);
    try {
      const product = await openFoodFactsService.getProductByBarcode(barcodeInput.trim());
      if (product) {
        setFoodName(product.brand ? `${product.brand} - ${product.name}` : product.name);
        setCalories(product.calories.toString());
        setProtein(product.protein_g.toString());
        setCarbs(product.carbs_g.toString());
        setFats(product.fats_g.toString());
        Alert.alert('Barcode Found! 🥫', `Loaded nutrition for "${product.name}"`);
      } else {
        Alert.alert('Not Found', 'No product found for this barcode in Open Food Facts database.');
      }
    } catch (e) {
      Alert.alert('Error', 'Barcode lookup failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!foodName.trim()) {
      Alert.alert('Missing Name', 'Please enter a food or meal name.');
      return;
    }

    await addMeal({
      date: todayDate,
      meal_type: mealType,
      food_name: foodName.trim(),
      calories: parseFloat(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fats_g: parseFloat(fats) || 0,
      barcode: barcodeInput.trim() || undefined,
    });

    // Reset & Close
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setBarcodeInput('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Meal</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle-outline" size={28} color={theme.colors.dark.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Meal Type Selector */}
            <Text style={styles.inputLabel}>Meal Type</Text>
            <View style={styles.mealTypeRow}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
                const isActive = mealType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.mealTypeBtn, isActive && styles.mealTypeBtnActive]}
                    onPress={() => setMealType(type)}
                  >
                    <Text style={[styles.mealTypeText, isActive && styles.mealTypeTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Barcode Scanner Section (🔒 Premium) */}
            <Text style={styles.inputLabel}>Barcode Lookup (Open Food Facts API v3 🔒)</Text>
            <View style={styles.barcodeRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter barcode (e.g. 3017624010701)"
                placeholderTextColor={theme.colors.dark.outline}
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.barcodeScanBtn}
                onPress={handleBarcodeLookup}
                disabled={scanning}
              >
                {scanning ? (
                  <ActivityIndicator size="small" color={theme.colors.dark.onPrimary} />
                ) : (
                  <Ionicons name="barcode-outline" size={20} color={theme.colors.dark.onPrimary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Manual Entry Fields */}
            <Text style={styles.inputLabel}>Food / Meal Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grilled Chicken Salad"
              placeholderTextColor={theme.colors.dark.outline}
              value={foodName}
              onChangeText={setFoodName}
            />

            <View style={styles.macroRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Calories (kcal)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={theme.colors.dark.outline}
                  keyboardType="number-pad"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={theme.colors.dark.outline}
                  keyboardType="decimal-pad"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
            </View>

            <View style={styles.macroRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={theme.colors.dark.outline}
                  keyboardType="decimal-pad"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Fats (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={theme.colors.dark.outline}
                  keyboardType="decimal-pad"
                  value={fats}
                  onChangeText={setFats}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMeal}>
              <Text style={styles.saveBtnText}>Save Meal Log</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.dark.surface,
    borderTopLeftRadius: theme.shapes.large * 1.5,
    borderTopRightRadius: theme.shapes.large * 1.5,
    maxHeight: '90%',
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 12,
    marginBottom: 6,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.shapes.small,
    backgroundColor: theme.colors.dark.surfaceVariant,
    alignItems: 'center',
  },
  mealTypeBtnActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  mealTypeTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  barcodeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeScanBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingHorizontal: 16,
    borderRadius: theme.shapes.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: theme.colors.dark.background,
    borderRadius: theme.shapes.medium,
    color: theme.colors.dark.onSurface,
    padding: theme.spacing.md,
    fontSize: 15,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 14,
    borderRadius: theme.shapes.large,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  saveBtnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
