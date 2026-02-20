import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DashboardMetricsGrid } from '@/features/dashboard/DashboardMetricsGrid';
import { KpiSummary } from '@/features/dashboard/KpiSummary';
import { FleetSummary } from '@/features/dashboard/FleetSummary';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useGetComprehensiveDashboardQuery } from '@/store/api/dashboardApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
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
      <ScreenHeader
        title="Dashboard"
        subtitle={subtitle}
        rightAction={(
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push('/(tabs)/dashboard-chat')}
            accessibilityRole="button"
            accessibilityLabel="Open assistant"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
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
  chatButton: {
    backgroundColor: colors.primaryLight,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
});
