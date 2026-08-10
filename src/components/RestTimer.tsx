import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface RestTimerProps {
  initialSeconds?: number;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds = 60, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const slideAnim = useRef(new Animated.Value(100)).current; // Start below screen

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    // Slide down animation
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const addTime = () => {
    setSecondsLeft((prev) => prev + 30);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.leftContent}>
        <Ionicons name="timer-outline" size={24} color={theme.colors.dark.primary} />
        <Text style={styles.timeText}>{formatTime(secondsLeft)}</Text>
        <Text style={styles.label}>Rest</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={addTime}>
          <Text style={styles.buttonText}>+30s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above the keyboard or bottom bar if present
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    ...theme.typography.title,
    color: theme.colors.dark.onSurface,
    fontVariant: ['tabular-nums'], // Keeps width consistent
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.dark.outline,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.shapes.full,
  },
  buttonText: {
    ...theme.typography.button,
    fontSize: 14,
    color: theme.colors.dark.onSurface,
  },
  skipButton: {
    backgroundColor: theme.colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.shapes.full,
  },
  skipButtonText: {
    ...theme.typography.button,
    fontSize: 14,
    color: theme.colors.dark.onPrimary,
  },
});
