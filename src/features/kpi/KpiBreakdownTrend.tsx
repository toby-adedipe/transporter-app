import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card, EmptyState, FilterChip, SkeletonLoader, StatusPill } from '@/components/ui';
import { colors, fontSize, fontWeight, fontFamily, spacing, borderRadius, shadows } from '@/constants/theme';
import {
  KPI_BREAKDOWN_PERIOD_OPTIONS,
  type KpiBreakdownPeriodKey,
  type KpiBreakdownTrendRow,
} from '@/features/kpi/useKpiBreakdownData';
import { formatKpiType } from '@/utils/kpiHelpers';
import type { KpiTrendSignal, KpiType } from '@/types/api';

const CHART_WIDTH = Dimensions.get('window').width - spacing.base * 3;

const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(75, 106, 155, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 122, 141, ${opacity})`,
  fillShadowGradient: '#4B6A9B',
  fillShadowGradientOpacity: 0.15,
  strokeWidth: 2.5,
  style: { borderRadius: 12 },
  propsForDots: { r: '5', strokeWidth: '2.5', stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '' },
};

interface KpiBreakdownTrendProps {
  metricType: KpiType;
  selectedPeriod: KpiBreakdownPeriodKey;
  onSelectPeriod: (period: KpiBreakdownPeriodKey) => void;
  trendRows: KpiBreakdownTrendRow[];
  trendSignal: KpiTrendSignal;
  trendDeltaPercent: number | null;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

const getTrendTone = (signal: KpiTrendSignal): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (signal === 'improving') return 'success';
  if (signal === 'declining') return 'danger';
  if (signal === 'stable') return 'warning';
  return 'neutral';
};

const getTrendLabel = (signal: KpiTrendSignal): string => {
  if (signal === 'insufficient_data') return 'Limited data';
  if (signal === 'improving') return 'Improving';
  if (signal === 'declining') return 'Declining';
  return 'Stable';
};

const formatMetricValue = (value: number | null): string => {
  if (value === null) return '-';
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
};

export function KpiBreakdownTrend({
  metricType,
  selectedPeriod,
  onSelectPeriod,
  trendRows,
  trendSignal,
  trendDeltaPercent,
  isLoading,
  isError,
  isFetching,
  onRetry,
}: KpiBreakdownTrendProps) {
  const chartPoints = trendRows.map((item) => item.value);
  const chartLabels =
    trendRows.length > 6
      ? trendRows
          .filter((_, index) => index % Math.ceil(trendRows.length / 6) === 0)
          .map((point) => point.label)
      : trendRows.map((point) => point.label);

  const baselineWindow = trendRows.slice(0, Math.min(3, trendRows.length));
  const baseline =
    baselineWindow.length > 0
      ? baselineWindow.reduce((sum, point) => sum + point.value, 0) / baselineWindow.length
      : null;
  const latest = trendRows.length > 0 ? trendRows[trendRows.length - 1].rawValue : null;

  if (isLoading) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>Metric Trend</Text>
        <SkeletonLoader width="100%" height={48} />
        <SkeletonLoader width="100%" height={220} style={{ marginTop: spacing.md }} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>Metric Trend</Text>
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to load trend data"
          subtitle="Retry to continue trend analysis"
          actionLabel="Retry"
          onAction={onRetry}
        />
      </Card>
    );
  }

  return (
    <Card variant="default" padding="base">
      <View style={styles.headerRow}>
        <Text style={styles.title}>{formatKpiType(metricType)} trend</Text>
        <StatusPill label={getTrendLabel(trendSignal)} tone={getTrendTone(trendSignal)} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {KPI_BREAKDOWN_PERIOD_OPTIONS.map((period) => (
          <FilterChip
            key={period.key}
            label={period.label}
            selected={selectedPeriod === period.key}
            onPress={() => onSelectPeriod(period.key)}
          />
        ))}
      </ScrollView>

      {trendRows.length === 0 ? (
        <EmptyState icon="bar-chart-outline" title="No trend data" subtitle="Try a different period" />
      ) : (
        <>
          <LineChart
            data={{ labels: chartLabels, datasets: [{ data: chartPoints.length > 0 ? chartPoints : [0] }] }}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>LATEST</Text>
              <Text style={styles.statValue}>{formatMetricValue(latest)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>BASELINE</Text>
              <Text style={styles.statValue}>{formatMetricValue(baseline)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DELTA</Text>
              <Text style={styles.statValue}>
                {trendDeltaPercent === null ? 'N/A' : `${trendDeltaPercent.toFixed(1)}%`}
              </Text>
            </View>
          </View>

          {isFetching ? <Text style={styles.refreshingText}>Refreshing trend data...</Text> : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  chipRow: { flexGrow: 0, marginBottom: spacing.sm },
  chart: { borderRadius: 12, marginTop: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
  refreshingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
});
