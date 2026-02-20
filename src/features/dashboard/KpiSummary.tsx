import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MetricCard, SkeletonLoader } from '@/components/ui';
import { useGetKpiRankingsQuery } from '@/store/api/kpiApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatKpiType, getKpiColor } from '@/utils/kpiHelpers';
import { colors, spacing, fontSize, fontWeight, fontFamily, borderRadius, shadows } from '@/constants/theme';
import type { KpiRankingEntry } from '@/types/api';

export function KpiSummary() {
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
  const topKpis = rankings.slice(0, 4);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>KPI Performance</Text>
        </View>
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} width="48%" height={80} />
          ))}
        </View>
      </View>
    );
  }

  if (rankings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>KPI Performance</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/(tabs)/kpi')}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {topKpis.length > 0 && (
        <View style={styles.grid}>
          {topKpis.map((kpi, index) => (
            <TouchableOpacity
              key={`${kpi.kpiType}-${index}`}
              style={styles.cardWrapper}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    ...shadows.md,
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
    fontFamily: fontFamily.semibold,
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
    fontFamily: fontFamily.medium,
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
