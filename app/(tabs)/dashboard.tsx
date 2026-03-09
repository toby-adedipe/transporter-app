import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DashboardMetricsGrid } from '@/features/dashboard/DashboardMetricsGrid';
import { KpiSummary } from '@/features/dashboard/KpiSummary';
import { FleetSummary } from '@/features/dashboard/FleetSummary';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useGetComprehensiveDashboardQuery } from '@/store/api/dashboardApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing } from '@/constants/theme';

export default function DashboardScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { isFetching, refetch } = useGetComprehensiveDashboardQuery(
    { transporterNumber, startDate, endDate },
    { skip: !transporterNumber },
  );

  const handleRefresh = useCallback(() => {
    if (!transporterNumber) return;
    try {
      refetch();
    } catch {
      // Can happen if pull-to-refresh fires before query initialization.
    }
  }, [refetch, transporterNumber]);

  const displayName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : null;
  const subtitle = displayName
    ? `Welcome, ${displayName}`
    : 'Overview of your operations';

  return (
    <View style={styles.container}>
      {/* AI chat entry point intentionally hidden for now. */}
      <ScreenHeader
        title="Dashboard"
        subtitle={subtitle}
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
        <KpiSummary />
        <FleetSummary />
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
});
