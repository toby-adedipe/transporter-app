import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MetricCard, SkeletonLoader } from '@/components/ui';
import { useGetKpiRankingsQuery } from '@/store/api/kpiApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatKpiType, getKpiColor } from '@/utils/kpiHelpers';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export function KpiOverview() {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading } = useGetKpiRankingsQuery(
    { transporterNumber, startDate, endDate },
    { skip: !transporterNumber },
  );

  const resultData = data?.result as any;
  const rankings: any[] = resultData?.rankings ?? [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width="100%" height={80} />
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} width="48%" height={100} />
          ))}
        </View>
      </View>
    );
  }

  const bestRank = rankings.length > 0
    ? Math.min(...rankings.map((r: any) => r.rank ?? Infinity))
    : '-';
  const totalTransporters = rankings.length > 0 ? rankings[0]?.populationCount : null;

  return (
    <View style={styles.container}>
      <View style={styles.rankCard}>
        <Text style={styles.rankLabel}>Best Ranking</Text>
        <Text style={styles.rankValue}>#{bestRank}</Text>
        {totalTransporters && (
          <Text style={styles.rankTotal}>out of {totalTransporters} transporters</Text>
        )}
      </View>

      {rankings.length > 0 && (
        <View style={styles.grid}>
          {rankings.map((kpi: any, index: number) => (
            <MetricCard
              key={`${kpi.kpiType}-${index}`}
              title={formatKpiType(kpi.kpiType ?? '')}
              value={kpi.metricValue ?? '-'}
              accentColor={getKpiColor(kpi.metricValue ?? 0)}
              subtitle={kpi.rank ? `Rank #${kpi.rank}` : undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.base },
  rankCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: fontWeight.medium,
  },
  rankValue: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    marginVertical: spacing.xs,
  },
  rankTotal: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
