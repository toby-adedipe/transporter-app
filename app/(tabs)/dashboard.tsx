import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Badge } from '@/components/ui';
import { DashboardMetricsGrid } from '@/features/dashboard/DashboardMetricsGrid';
import { OperationalSummary } from '@/features/dashboard/OperationalSummary';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useGetComprehensiveDashboardQuery } from '@/store/api/dashboardApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function DashboardScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { isFetching, refetch } = useGetComprehensiveDashboardQuery(
    { transporterNumber, startDate, endDate },
    { skip: !transporterNumber },
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const subtitle = user?.transporterName
    ? `Welcome, ${user.transporterName}`
    : 'Overview of your operations';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Dashboard"
        subtitle={subtitle}
        rightAction={
          transporterNumber ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{transporterNumber}</Text>
            </View>
          ) : undefined
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <DashboardMetricsGrid />
        <OperationalSummary />
        <QuickActions />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.base,
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
