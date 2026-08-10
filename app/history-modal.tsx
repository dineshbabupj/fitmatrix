import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { storage, HistoryRecord } from '../src/data/storage';
import { exportHealthReportPdf } from '../src/utils/pdfExporter';

export default function HistoryModalScreen() {
  const [filter, setFilter] = useState<'ALL' | 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight'>('ALL');
  const [records, setRecords] = useState<HistoryRecord[]>(storage.getHistory());

  const handleFilterChange = (type: 'ALL' | 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight') => {
    setFilter(type);
    if (type === 'ALL') {
      setRecords(storage.getHistory());
    } else {
      setRecords(storage.getHistory(type));
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all calculation logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            storage.clearHistory();
            setRecords([]);
          },
        },
      ]
    );
  };

  const handleDeleteItem = (id: string) => {
    storage.deleteHistory(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const filterOptions: ('ALL' | 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight')[] = [
    'ALL',
    'BMI',
    'BMR',
    'Body Fat',
    'Ideal Weight',
  ];

  return (
    <View style={styles.container}>
      {/* Bottom Sheet Drag Indicator Handle */}
      <View style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
      </View>

      {/* Segmented Control Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const active = filter === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => handleFilterChange(item)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* History List */}
      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={48} color={theme.colors.dark.outline} />
          <Text style={styles.emptyTitle}>No History Recorded</Text>
          <Text style={styles.emptySubtitle}>
            Perform health calculations to view your saved history logs here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.typeText}>{item.type}</Text>
                  <Text style={styles.dateText}>{new Date(item.date).toLocaleString()}</Text>
                </View>
                <Text style={styles.resultText}>{item.result}</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteItem(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.dark.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Footer Actions */}
      {records.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => {
              const exportItems = records.map((r) => ({
                type: r.type,
                value: r.result,
                unit: '',
                date: new Date(r.date).toLocaleDateString(),
              }));
              exportHealthReportPdf(exportItems);
            }}
          >
            <Ionicons name="document-text-outline" size={18} color={theme.colors.dark.onPrimary} />
            <Text style={styles.exportBtnText}>Export Health PDF Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Ionicons name="trash-bin-outline" size={18} color={theme.colors.dark.onError} />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.surface,
    borderTopLeftRadius: theme.shapes.large,
    borderTopRightRadius: theme.shapes.large,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.dark.outline,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark.surfaceVariant,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.surfaceVariant,
    marginRight: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.hero,
  },
  card: {
    backgroundColor: theme.colors.dark.background,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    flex: 1,
    paddingRight: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.primary,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
  },
  resultText: {
    fontSize: 13,
    color: theme.colors.dark.onSurface,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark.surfaceVariant,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  exportBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  clearBtn: {
    backgroundColor: theme.colors.dark.error,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  clearBtnText: {
    color: theme.colors.dark.onError,
    fontWeight: '700',
    fontSize: 13,
  },
});
