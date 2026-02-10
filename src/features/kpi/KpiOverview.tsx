import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MetricCard, SkeletonLoader } from '@/components/ui';
import { useGetKpiSummaryQuery } from '@/store/api/kpiApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatKpiType, getKpiColor } from '@/utils/kpiHelpers';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export function KpiOverview() {
  const transporterNumber = useAppSelector((s) => s.auth.user?.transporterNumber ?? '');

  const { data, isLoading } = useGetKpiSummaryQuery(
    { transporterNumber },
    { skip: !transporterNumber },
  );

  const summary = data?.data as any;

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

  const overallRank = summary?.overallRank ?? summary?.rank ?? '-';
  const kpiScores: any[] = summary?.kpiScores ?? summary?.rankings ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.rankCard}>
        <Text style={styles.rankLabel}>Overall Ranking</Text>
        <Text style={styles.rankValue}>#{overallRank}</Text>
        {summary?.totalTransporters && (
          <Text style={styles.rankTotal}>out of {summary.totalTransporters} transporters</Text>
        )}
      </View>

      {kpiScores.length > 0 && (
        <View style={styles.grid}>
          {kpiScores.map((kpi: any, index: number) => (
            <MetricCard
              key={kpi.kpiType ?? index}
              title={formatKpiType(kpi.kpiType ?? '')}
              value={kpi.score ?? kpi.value ?? '-'}
              accentColor={getKpiColor(kpi.score ?? 0)}
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
