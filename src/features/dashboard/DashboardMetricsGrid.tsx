import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { MetricCard, SkeletonLoader } from '@/components/ui';
import { useGetComprehensiveDashboardQuery } from '@/store/api/dashboardApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing, borderRadius } from '@/constants/theme';

const METRIC_CARDS = [
  { key: 'totalTrucks', title: 'Total Trucks', color: colors.primary },
  { key: 'activeTrips', title: 'Active Trips', color: colors.success },
  { key: 'trucksLoaded', title: 'Trucks Loaded', color: colors.warning },
  { key: 'atCustomer', title: 'At Customer', color: '#8B5CF6' },
  { key: 'notTracking', title: 'Not Tracking', color: colors.danger },
  { key: 'inTransit', title: 'In Transit', color: '#0EA5E9' },
] as const;

export function DashboardMetricsGrid() {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading, isFetching, refetch } =
    useGetComprehensiveDashboardQuery(
      { transporterNumber, startDate, endDate },
      {
        skip: !transporterNumber,
        pollingInterval: 30_000,
      },
    );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const dashboardData = data?.data as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <View style={styles.grid}>
        {METRIC_CARDS.map((card) => (
          <View key={card.key} style={styles.cardWrapper}>
            <SkeletonLoader
              width="100%"
              height={100}
              borderRadius={borderRadius.lg}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {METRIC_CARDS.map((card) => {
        const rawValue = dashboardData?.[card.key];
        const value =
          typeof rawValue === 'number' || typeof rawValue === 'string'
            ? rawValue
            : '--';

        return (
          <View key={card.key} style={styles.cardWrapper}>
            <MetricCard
              title={card.title}
              value={value}
              accentColor={card.color}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
