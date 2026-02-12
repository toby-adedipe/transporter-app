import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MetricCard, SkeletonLoader } from '@/components/ui';
import { useGetKpiRankingsQuery } from '@/store/api/kpiApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatKpiType, getKpiColor } from '@/utils/kpiHelpers';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export function KpiSummary() {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading } = useGetKpiRankingsQuery(
    { transporterNumber, startDate, endDate },
    { skip: !transporterNumber },
  );

  const resultData = data?.result as any;
  const rankings: any[] = resultData?.rankings ?? [];
  const topKpis = rankings.slice(0, 4); // Show top 4 KPIs

  const bestRank = rankings.length > 0
    ? Math.min(...rankings.map((r: any) => r.rank ?? Infinity))
    : null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>KPI Performance</Text>
        </View>
        <SkeletonLoader width={100} height={60} style={{ marginBottom: spacing.md }} />
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} width="48%" height={80} />
          ))}
        </View>
      </View>
    );
  }

  if (rankings.length === 0) {
    return null; // Don't show if no data
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>KPI Performance</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/kpi')}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {bestRank !== null && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankLabel}>Best Rank</Text>
          <Text style={styles.rankValue}>#{bestRank}</Text>
        </View>
      )}

      {topKpis.length > 0 && (
        <View style={styles.grid}>
          {topKpis.map((kpi: any, index: number) => (
            <View key={`${kpi.kpiType}-${index}`} style={styles.cardWrapper}>
              <MetricCard
                title={formatKpiType(kpi.kpiType ?? '')}
                value={kpi.metricValue ?? '-'}
                accentColor={getKpiColor(kpi.metricValue ?? 0)}
                subtitle={kpi.rank ? `Rank #${kpi.rank}` : undefined}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  rankBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rankLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  rankValue: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardWrapper: {
    width: '48%',
    flexGrow: 1,
  },
});
