import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, InsightCard, SkeletonLoader, StatusPill } from '@/components/ui';
import { borderRadius, colors, fontSize, fontWeight, fontFamily, spacing, shadows } from '@/constants/theme';
import type { KpiBreakdownSelectedMetric } from '@/features/kpi/useKpiBreakdownData';
import type { KpiContributorMetric, KpiDeterministicInsight } from '@/types/api';

interface KpiBreakdownSummaryProps {
  selectedMetric: KpiBreakdownSelectedMetric | null;
  insight: KpiDeterministicInsight | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const formatValue = (value: number | null, unit?: string): string => {
  if (value === null) return '-';
  const base = Number.isInteger(value) ? `${value}` : value.toFixed(2);
  return unit ? `${base} ${unit}` : base;
};

const formatPercent = (value: number | null): string => {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

const getSeverityTone = (severity: KpiDeterministicInsight['severity']): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (severity === 'healthy') return 'success';
  if (severity === 'warning') return 'warning';
  if (severity === 'critical') return 'danger';
  return 'neutral';
};

const getSeverityLabel = (severity: KpiDeterministicInsight['severity']): string => {
  if (severity === 'healthy') return 'Healthy';
  if (severity === 'warning') return 'Watch';
  if (severity === 'critical') return 'Needs Attention';
  return 'No Target';
};

const renderRankingSummary = (metric: KpiBreakdownSelectedMetric | null): string | null => {
  if (!metric?.rankings) return null;
  const segments = ['1', '7', '30']
    .map((window) => {
      const value = metric.rankings?.[window];
      if (value == null || String(value).trim() === '') return null;
      return `${window}d: ${value}`;
    })
    .filter((item): item is string => item !== null);

  return segments.length > 0 ? segments.join(' • ') : null;
};

const contributorSubtitle = (item: KpiContributorMetric): string => {
  const parts = [
    `Current: ${formatValue(item.actual, item.unit)}`,
    item.expected !== null ? `Target: ${formatValue(item.expected, item.unit)}` : null,
    item.variance !== null ? `Variance: ${item.variance.toFixed(2)}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join(' • ');
};

export function KpiBreakdownSummary({
  selectedMetric,
  insight,
  isLoading,
  isError,
  onRetry,
}: KpiBreakdownSummaryProps) {
  if (isLoading) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Health</Text>
        <SkeletonLoader width="100%" height={140} />
        <SkeletonLoader width="100%" height={100} style={{ marginTop: spacing.md }} />
        <SkeletonLoader width="100%" height={140} style={{ marginTop: spacing.md }} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Health</Text>
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to load KPI breakdown"
          subtitle="Retry to continue with KPI analysis"
          actionLabel="Retry"
          onAction={onRetry}
        />
      </Card>
    );
  }

  if (!selectedMetric || !insight) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Health</Text>
        <EmptyState
          icon="analytics-outline"
          title="Selected KPI is unavailable"
          subtitle="Try another KPI metric from the KPI page"
        />
      </Card>
    );
  }

  const rankingSummary = renderRankingSummary(selectedMetric);

  return (
    <Card variant="default" padding="base">
      <Text style={styles.title}>KPI Health</Text>

      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <Text style={styles.metricTitle}>{selectedMetric.title}</Text>
          <StatusPill
            label={getSeverityLabel(insight.severity)}
            tone={getSeverityTone(insight.severity)}
          />
        </View>

        <Text style={styles.metricValue}>{formatValue(selectedMetric.actual, selectedMetric.unit)}</Text>
        <Text style={styles.summaryText}>{insight.summary}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>GAP RATIO</Text>
            <Text style={styles.statValue}>{formatPercent(insight.gapRatio)}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>TREND</Text>
            <Text style={styles.statValue}>{insight.trendSignal.replace('_', ' ')}</Text>
          </View>
        </View>

        {rankingSummary ? <Text style={styles.rankingText}>Rankings: {rankingSummary}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Why It Moved</Text>
      {insight.topContributors.length === 0 ? (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>No contributor signals are available for this metric.</Text>
        </View>
      ) : (
        <View style={styles.cardsColumn}>
          {insight.topContributors.map((item) => (
            <InsightCard
              key={item.key}
              title={item.label}
              subtitle={contributorSubtitle(item)}
            />
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>What Next</Text>
      <View style={styles.cardsColumn}>
        {insight.actions.map((action) => (
          <InsightCard
            key={action.id}
            title={action.title}
            subtitle={action.description}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  healthCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  metricValue: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  summaryText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
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
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    textTransform: 'capitalize',
  },
  rankingText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  cardsColumn: {
    gap: spacing.sm,
  },
  fallbackContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.base,
  },
  fallbackText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
});
