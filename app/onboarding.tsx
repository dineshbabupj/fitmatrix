import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { useUserStore } from '../src/store/userStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Precision Health Calculators',
    subtitle: 'Calculate your BMI, BMR, Body Fat percentage, and Ideal Weight using clinically validated formulas.',
    icon: 'fitness-outline',
    color: '#4CAF50',
  },
  {
    id: '2',
    title: 'Offline-First & Cloud Sync',
    subtitle: 'Your data is saved instantly to local SQLite storage. Syncs seamlessly with the cloud when online.',
    icon: 'cloud-offline-outline',
    color: '#FF9800',
  },
  {
    id: '3',
    title: 'Track Analytics & Progress',
    subtitle: 'Visualize your health trends over 7d, 30d, 90d with interactive charts and personalized tips.',
    icon: 'stats-chart-outline',
    color: '#00BCD4',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);

  const handleFinish = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <View style={styles.header}>
        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>

      {/* Slides FlatList */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={80} color={item.color} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Pagination Dots & Next CTA */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx ? styles.activeDot : undefined,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={theme.colors.dark.onPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 90,
  },
  skipText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.hero,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.hero,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.hero,
    gap: theme.spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.dark.surfaceVariant,
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.colors.dark.primary,
  },
  nextBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 14,
    borderRadius: theme.shapes.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
