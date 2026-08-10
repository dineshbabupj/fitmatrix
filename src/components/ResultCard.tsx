import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ResultCardProps {
  title: string;
  value: string;
  category?: string;
  categoryColor?: string;
  subtitle?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  category,
  categoryColor = '#4CAF50',
  subtitle,
}) => {
  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${title}: ${value}. ${category ? `Category: ${category}.` : ''} ${subtitle || ''}`}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.title} allowFontScaling={true}>
        {title}
      </Text>
      <Text style={styles.value} allowFontScaling={true}>
        {value}
      </Text>
      {category && (
        <View
          style={[styles.badge, { backgroundColor: categoryColor }]}
          accessibilityLabel={`Category: ${category}`}
        >
          <Text style={styles.badgeText} allowFontScaling={true}>
            {category}
          </Text>
        </View>
      )}
      {subtitle && (
        <Text style={styles.subtitle} allowFontScaling={true}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A2C28',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6E1E5',
    marginBottom: 8,
  },
  value: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#81C784',
    marginBottom: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 14,
    color: '#A5D6A7',
    textAlign: 'center',
  },
});
