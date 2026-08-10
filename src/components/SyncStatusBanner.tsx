import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncEngine, SyncState } from '../services/offline/syncEngine';
import { theme } from '../theme/theme';

export const SyncStatusBanner: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>(syncEngine.getSyncState());

  useEffect(() => {
    // Initial fetch of pending count
    syncEngine.refreshPendingCount();

    // Subscribe to sync state changes
    const unsubscribe = syncEngine.subscribe((state) => {
      setSyncState(state);
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = () => {
    if (syncState.isOnline && !syncState.isSyncing) {
      syncEngine.processSyncQueue();
    }
  };

  // Render appropriate status banner
  if (!syncState.isOnline) {
    return (
      <View style={[styles.banner, styles.offlineBanner]}>
        <Ionicons name="cloud-offline-outline" size={16} color="#FFB74D" />
        <Text style={styles.offlineText}>Offline Mode — Calculations saved locally to SQLite</Text>
      </View>
    );
  }

  if (syncState.isSyncing) {
    return (
      <View style={[styles.banner, styles.syncingBanner]}>
        <ActivityIndicator size="small" color={theme.colors.dark.primary} />
        <Text style={styles.syncingText}>
          Syncing {syncState.pendingCount} item{syncState.pendingCount === 1 ? '' : 's'} to Cloud...
        </Text>
      </View>
    );
  }

  if (syncState.pendingCount > 0) {
    return (
      <TouchableOpacity style={[styles.banner, styles.pendingBanner]} onPress={handleManualSync}>
        <Ionicons name="sync-outline" size={16} color={theme.colors.dark.primary} />
        <Text style={styles.pendingText}>
          {syncState.pendingCount} calculation{syncState.pendingCount === 1 ? '' : 's'} pending sync (Tap to sync)
        </Text>
      </TouchableOpacity>
    );
  }

  return null; // Hidden when 0 pending & online & idle
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  offlineBanner: {
    backgroundColor: '#2E2215',
    borderWidth: 1,
    borderColor: '#7A5216',
  },
  offlineText: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: '600',
  },
  syncingBanner: {
    backgroundColor: theme.colors.dark.primaryContainer + '66',
    borderWidth: 1,
    borderColor: theme.colors.dark.primary,
  },
  syncingText: {
    color: theme.colors.dark.onPrimaryContainer,
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBanner: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline,
  },
  pendingText: {
    color: theme.colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
