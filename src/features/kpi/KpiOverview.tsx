import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MetricCard, SkeletonLoader } from '@/components/ui';
import { useGetKpiRankingsQuery } from '@/store/api/kpiApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatKpiType, getKpiColor } from '@/utils/kpiHelpers';
import { spacing } from '@/constants/theme';
import type { KpiRankingEntry } from '@/types/api';

export function KpiOverview() {
  const router = useRouter();
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading } = useGetKpiRankingsQuery(
    { transporterNumber, startDate, endDate },
    { skip: !transporterNumber },
  );

  const rankingResult = data?.result;
  const rankings: KpiRankingEntry[] = Array.isArray(rankingResult)
    ? rankingResult
    : Array.isArray(rankingResult?.rankings)
      ? rankingResult.rankings
      : [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} width="48%" height={100} />
          ))}
        </View>
      </View>
    );
  }

  if (rankings.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {rankings.map((kpi, index) => (
          <TouchableOpacity
            key={`${kpi.kpiType}-${index}`}
            style={styles.tileWrapper}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/reports/kpi-breakdown/[metricType]',
                params: { metricType: kpi.kpiType ?? '' },
              })
            }
          >
            <MetricCard
              title={formatKpiType(kpi.kpiType ?? '')}
              value={kpi.metricValue ?? '-'}
              accentColor={getKpiColor(kpi.metricValue ?? 0)}
              subtitle={kpi.rank ? `Rank #${kpi.rank}` : undefined}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tileWrapper: {
    width: '48%',
    flexGrow: 1,
  },
});
