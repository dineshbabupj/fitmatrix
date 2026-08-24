import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { useWaterStore } from '../../src/store/waterStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WaterDashboardScreen() {
  const { dailyGoal, getTodayIntake, addWater } = useWaterStore();
  const currentIntake = getTodayIntake();
  
  // Progress animation (0 to 1)
  const progress = Math.min(currentIntake / dailyGoal, 1);
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedHeight, {
      toValue: progress,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [progress]);

  const handleAddWater = (amount: number) => {
    addWater(amount);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.dark.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hydration</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.dark.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Visual Water Tank Background */}
        <View style={styles.tankContainer}>
          <Animated.View
            style={[
              styles.waterFill,
              {
                height: animatedHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          
          <View style={styles.statsOverlay}>
            <Ionicons name="water" size={48} color="#03A9F4" style={{ marginBottom: 16 }} />
            <Text style={styles.currentText}>{currentIntake} ml</Text>
            <Text style={styles.goalText}>of {dailyGoal} ml daily goal</Text>
            
            {currentIntake >= dailyGoal && (
              <View style={styles.goalReachedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.goalReachedText}>Goal Reached!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsTitle}>Quick Add</Text>
          
          <View style={styles.quickAddGrid}>
            <TouchableOpacity 
              style={styles.quickAddBtn} 
              onPress={() => handleAddWater(100)}
            >
              <Ionicons name="cafe-outline" size={28} color={theme.colors.dark.primary} />
              <Text style={styles.quickAddAmount}>100 ml</Text>
              <Text style={styles.quickAddDesc}>Small Cup</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAddBtn, styles.quickAddBtnPrimary]} 
              onPress={() => handleAddWater(250)}
            >
              <Ionicons name="water-outline" size={36} color="#121212" />
              <Text style={[styles.quickAddAmount, { color: '#121212' }]}>+250 ml</Text>
              <Text style={[styles.quickAddDesc, { color: '#12121288' }]}>Glass</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAddBtn} 
              onPress={() => handleAddWater(500)}
            >
              <Ionicons name="pint-outline" size={28} color={theme.colors.dark.primary} />
              <Text style={styles.quickAddAmount}>500 ml</Text>
              <Text style={styles.quickAddDesc}>Bottle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    zIndex: 10,
  },
  backBtn: {
    padding: 4,
  },
  settingsBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
  },
  content: {
    flex: 1,
  },
  tankContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: SCREEN_HEIGHT * 0.45,
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#03A9F433', // Deep blue translucent
  },
  statsOverlay: {
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: theme.colors.dark.surfaceVariant + '44',
    padding: 32,
    borderRadius: 32,
  },
  currentText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 4,
  },
  goalText: {
    fontSize: 18,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '600',
  },
  goalReachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5022',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  goalReachedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlsContainer: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: theme.colors.dark.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  controlsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 24,
    textAlign: 'center',
  },
  quickAddGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quickAddBtn: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    width: '31%',
    aspectRatio: 0.8,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.dark.outline + '40',
  },
  quickAddBtnPrimary: {
    backgroundColor: '#03A9F4', // Custom bright blue for water
    borderColor: '#03A9F4',
    aspectRatio: 0.75, // Make the middle one taller
  },
  quickAddAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginTop: 12,
    marginBottom: 2,
  },
  quickAddDesc: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
  },
});
