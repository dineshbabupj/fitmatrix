import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { weatherService, WeatherInfo } from '../services/api/weatherService';

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    weatherService.getWeather().then((w) => {
      setWeather(w);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={theme.colors.dark.primary} />
      </View>
    );
  }

  if (!weather) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons
          name={weather.isIndoorRecommended ? 'rainy-outline' : 'sunny-outline'}
          size={24}
          color={theme.colors.dark.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.tempText}>{weather.temperatureC}°C — {weather.condition}</Text>
          <Text style={styles.recText}>{weather.recommendation}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.large,
    marginVertical: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  recText: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
});
