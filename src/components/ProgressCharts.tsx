import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CalculationRecord } from '../data/db';
import { theme } from '../theme/theme';
import { adMobManager } from '../services/admob/adMobManager';

const screenWidth = Dimensions.get('window').width - 32;

export type DateRange = '7d' | '30d' | '90d' | 'all';
export type MetricType = 'BMI' | 'Weight' | 'Body Fat';

interface SelectedPoint {
  index: number;
  value: number;
  label: string;
  dateStr: string;
  category?: string;
  metric: string;
}

interface ProgressChartsProps {
  records: CalculationRecord[];
  onRefresh?: () => void;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ records }) => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('BMI');
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(adMobManager.isPremiumFeatureUnlocked());

  const handleUnlockRewarded = () => {
    adMobManager.showRewardedAd(() => {
      setIsUnlocked(true);
    });
  };

  // Filter records by date range
  const filterByDate = (items: CalculationRecord[]): CalculationRecord[] => {
    const now = Date.now();
    let cutoffMs = 0;

    if (dateRange === '7d') cutoffMs = 7 * 24 * 60 * 60 * 1000;
    else if (dateRange === '30d') cutoffMs = 30 * 24 * 60 * 60 * 1000;
    else if (dateRange === '90d') cutoffMs = 90 * 24 * 60 * 60 * 1000;

    if (cutoffMs === 0) return items;
    return items.filter((item) => now - item.date <= cutoffMs);
  };

  const filteredRecords = filterByDate(records);

  // Process data for Line Chart based on selected metric
  const extractLineData = () => {
    let targetType: 'BMI' | 'Body Fat' | 'BMI';
    if (selectedMetric === 'Body Fat') targetType = 'Body Fat';
    else targetType = 'BMI';

    const matching = filteredRecords
      .filter((r) => {
        if (selectedMetric === 'Weight') return r.type === 'BMI' || r.type === 'BMR';
        return r.type === targetType;
      })
      .sort((a, b) => a.date - b.date);

    if (matching.length === 0) return null;

    const labels: string[] = [];
    const dataPoints: number[] = [];
    const pointDetails: { dateStr: string; category?: string; value: number }[] = [];

    // Limit visible labels to fit nicely on screen
    const maxPoints = 6;
    const step = Math.max(1, Math.floor(matching.length / maxPoints));

    matching.forEach((item, idx) => {
      let val = 0;

      if (selectedMetric === 'Weight') {
        try {
          const parsed = JSON.parse(item.inputs_json);
          val = parsed.weightKg || (parsed.weightLbs ? parsed.weightLbs * 0.453592 : 0);
        } catch {
          val = 0;
        }
      } else if (selectedMetric === 'BMI') {
        const match = item.result.match(/([\d.]+)/);
        val = match ? parseFloat(match[1]) : 0;
      } else if (selectedMetric === 'Body Fat') {
        const match = item.result.match(/([\d.]+)/);
        val = match ? parseFloat(match[1]) : 0;
      }

      if (val > 0) {
        const d = new Date(item.date);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        if (idx % step === 0 || idx === matching.length - 1) {
          labels.push(dateStr);
        } else {
          labels.push('');
        }
        dataPoints.push(parseFloat(val.toFixed(1)));
        pointDetails.push({
          dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          category: item.category,
          value: parseFloat(val.toFixed(1)),
        });
      }
    });

    if (dataPoints.length === 0) return null;

    return {
      labels: labels.length > 0 ? labels : ['1'],
      datasets: [
        {
          data: dataPoints,
          color: (opacity = 1) => theme.colors.dark.primary,
          strokeWidth: 2.5,
        },
      ],
      pointDetails,
    };
  };

  // Process data for Bar Chart (metric type distribution)
  const extractBarData = () => {
    const counts = {
      BMI: 0,
      BMR: 0,
      'Body Fat': 0,
      'Ideal Wt': 0,
    };

    filteredRecords.forEach((r) => {
      if (r.type === 'BMI') counts.BMI++;
      else if (r.type === 'BMR') counts.BMR++;
      else if (r.type === 'Body Fat') counts['Body Fat']++;
      else if (r.type === 'Ideal Weight') counts['Ideal Wt']++;
    });

    const hasData = Object.values(counts).some((c) => c > 0);
    if (!hasData) return null;

    return {
      labels: ['BMI', 'BMR', 'Body Fat', 'Ideal Wt'],
      datasets: [
        {
          data: [counts.BMI, counts.BMR, counts['Body Fat'], counts['Ideal Wt']],
        },
      ],
    };
  };

  const lineData = extractLineData();
  const barData = extractBarData();

  const chartConfig = {
    backgroundColor: theme.colors.dark.surface,
    backgroundGradientFrom: theme.colors.dark.surface,
    backgroundGradientTo: theme.colors.dark.surfaceVariant,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(129, 199, 132, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(196, 199, 197, ${opacity})`,
    style: {
      borderRadius: theme.shapes.large,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: theme.colors.dark.primary,
    },
  };

  return (
    <View style={styles.container}>
      {/* Date Range Filter Selector */}
      <View style={styles.filterRow}>
        {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.filterChip, dateRange === range && styles.filterChipActive]}
            onPress={() => {
              setDateRange(range);
              setSelectedPoint(null);
            }}
          >
            <Text style={[styles.filterChipText, dateRange === range && styles.filterChipTextActive]}>
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric Selector for Line Chart */}
      <View style={styles.metricSelectorRow}>
        {(['BMI', 'Weight', 'Body Fat'] as MetricType[]).map((metric) => (
          <TouchableOpacity
            key={metric}
            style={[styles.metricTab, selectedMetric === metric && styles.metricTabActive]}
            onPress={() => {
              setSelectedMetric(metric);
              setSelectedPoint(null);
            }}
          >
            <Text style={[styles.metricTabText, selectedMetric === metric && styles.metricTabTextActive]}>
              {metric}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Line Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up-outline" size={20} color={theme.colors.dark.primary} />
          <Text style={styles.cardTitle}>{selectedMetric} Trend Over Time</Text>
        </View>

        {lineData ? (
          <>
            <LineChart
              data={{
                labels: lineData.labels,
                datasets: lineData.datasets,
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              onDataPointClick={({ value, index, getColor }) => {
                const detail = lineData.pointDetails[index];
                setSelectedPoint({
                  index,
                  value,
                  label: lineData.labels[index],
                  dateStr: detail ? detail.dateStr : 'Selected Date',
                  category: detail?.category,
                  metric: selectedMetric,
                });
              }}
            />

            {/* Selected Data Point Detail Tooltip / Card */}
            {selectedPoint && (
              <View style={styles.pointDetailCard}>
                <View style={styles.pointDetailHeader}>
                  <Text style={styles.pointDetailTitle}>
                    {selectedPoint.metric}: {selectedPoint.value} {selectedPoint.metric === 'Weight' ? 'kg' : selectedPoint.metric === 'BMI' ? 'kg/m²' : '%'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedPoint(null)}>
                    <Ionicons name="close-circle-outline" size={18} color={theme.colors.dark.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.pointDetailDate}>Date: {selectedPoint.dateStr}</Text>
                {selectedPoint.category && (
                  <Text style={styles.pointDetailCategory}>Category: {selectedPoint.category}</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="stats-chart-outline" size={48} color={theme.colors.dark.outline} />
            <Text style={styles.emptyTitle}>No {selectedMetric} Data Recorded</Text>
            <Text style={styles.emptySubtitle}>
              No calculations found for {selectedMetric} within the selected date range.
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(tabs)/calculators')}
            >
              <Text style={styles.actionBtnText}>Log a Calculation</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Rewarded Ad Section: Watch Ad to unlock Premium Advanced Analytics */}
      {!isUnlocked ? (
        <View style={styles.rewardedCard}>
          <Ionicons name="gift-outline" size={28} color="#FFB74D" />
          <View style={styles.rewardedInfo}>
            <Text style={styles.rewardedTitle}>Unlock Advanced Health Analytics</Text>
            <Text style={styles.rewardedSub}>Watch a short 15-second sponsor video to reveal detailed trends.</Text>
          </View>
          <TouchableOpacity style={styles.rewardedBtn} onPress={handleUnlockRewarded} activeOpacity={0.8}>
            <Text style={styles.rewardedBtnText}>Watch Ad</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.unlockedBadge}>
          <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.dark.primary} />
          <Text style={styles.unlockedText}>Premium Health Analytics Unlocked 🎉</Text>
        </View>
      )}

      {/* Bar Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="bar-chart-outline" size={20} color={theme.colors.dark.secondary} />
          <Text style={styles.cardTitle}>Activity Distribution by Metric</Text>
        </View>

        {barData ? (
          <BarChart
            data={barData}
            width={screenWidth}
            height={200}
            yAxisLabel=""
            yAxisSuffix=" logs"
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(100, 181, 246, ${opacity})`,
            }}
            style={styles.chartStyle}
            showValuesOnTopOfBars
            fromZero
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="file-tray-outline" size={40} color={theme.colors.dark.outline} />
            <Text style={styles.emptyTitle}>No Distribution Data</Text>
            <Text style={styles.emptySubtitle}>
              Log your health calculations to see metric frequency breakdown.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.dark.surfaceVariant,
  },
  filterChipActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  metricSelectorRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: 3,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.shapes.small,
  },
  metricTabActive: {
    backgroundColor: theme.colors.dark.primaryContainer,
  },
  metricTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  metricTabTextActive: {
    color: theme.colors.dark.onPrimaryContainer,
  },
  chartCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  chartStyle: {
    borderRadius: theme.shapes.medium,
    marginVertical: 4,
  },
  pointDetailCard: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.dark.primary,
  },
  pointDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointDetailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  pointDetailDate: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
  },
  pointDetailCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.dark.primary,
    marginTop: 2,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: theme.spacing.lg,
  },
  actionBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.onPrimary,
  },
  rewardedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2215',
    borderWidth: 1,
    borderColor: '#7A5216',
    borderRadius: theme.shapes.large,
    padding: theme.spacing.md,
    gap: 12,
  },
  rewardedInfo: {
    flex: 1,
  },
  rewardedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFB74D',
  },
  rewardedSub: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  rewardedBtn: {
    backgroundColor: '#FFB74D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rewardedBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.dark.primaryContainer + '44',
    borderRadius: theme.shapes.medium,
    paddingVertical: 8,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.dark.primary,
  },
});
