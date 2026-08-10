import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  onHistoryPress?: () => void;
  onAboutPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onHistoryPress, onAboutPress }) => {
  return (
    <View style={styles.container} accessibilityRole="header">
      <Text style={styles.title} accessibilityRole="header" allowFontScaling={true}>
        {title}
      </Text>
      <View style={styles.actions}>
        {onHistoryPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onHistoryPress}
            accessibilityLabel="View Calculation History"
            accessibilityHint="Opens calculation history in a bottom sheet"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="time-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {onAboutPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onAboutPress}
            accessibilityLabel="More Options and About"
            accessibilityHint="Opens app info and medical disclaimer screen"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
