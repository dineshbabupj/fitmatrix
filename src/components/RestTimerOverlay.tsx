import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface RestTimerOverlayProps {
  initialSeconds?: number;
  isPremium?: boolean;
  onFinish?: () => void;
  onClose?: () => void;
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({
  initialSeconds = 60,
  isPremium = false,
  onFinish,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      Vibration.vibrate([0, 500, 200, 500]);
      if (onFinish) onFinish();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, onFinish]);

  const addTime = (secs: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + secs));
    setTotalSeconds((prev) => Math.max(1, prev + secs));
  };

  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress Bar Background */}
      <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />

      <View style={styles.contentRow}>
        <View style={styles.leftInfo}>
          <Ionicons
            name={isRunning ? 'timer-outline' : 'checkmark-circle'}
            size={24}
            color={theme.colors.dark.primary}
          />
          <View>
            <Text style={styles.titleText}>Rest Timer</Text>
            <Text style={styles.timeText}>{formatTime(secondsLeft)}</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.timeBtn} onPress={() => addTime(15)}>
            <Text style={styles.timeBtnText}>+15s</Text>
          </TouchableOpacity>

          {isPremium && (
            <TouchableOpacity style={styles.timeBtn} onPress={() => addTime(30)}>
              <Text style={styles.timeBtnText}>+30s</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={18}
              color={theme.colors.dark.onPrimary}
            />
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.dark.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: theme.shapes.large,
    borderWidth: 1,
    borderColor: theme.colors.dark.primary,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.dark.primaryContainer + '40',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleText: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBtn: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.shapes.small,
  },
  timeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.dark.primary,
  },
  actionBtn: {
    backgroundColor: theme.colors.dark.primary,
    padding: 8,
    borderRadius: theme.shapes.small,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
