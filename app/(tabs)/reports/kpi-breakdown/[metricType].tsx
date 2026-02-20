import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, EmptyState } from '@/components/ui';
import { KpiBreakdownSummary } from '@/features/kpi/KpiBreakdownSummary';
import { KpiBreakdownTrend } from '@/features/kpi/KpiBreakdownTrend';
import { KpiAiInsights } from '@/features/kpi/KpiAiInsights';
import {
  useKpiBreakdownData,
  type KpiBreakdownPeriodKey,
} from '@/features/kpi/useKpiBreakdownData';
import { colors, fontSize, fontWeight, fontFamily, spacing, borderRadius, shadows } from '@/constants/theme';
import { formatKpiType } from '@/utils/kpiHelpers';
import { getAvailableKpiRouteMetrics, parseMetricTypeParam } from '@/utils/kpiRouting';

export default function KpiBreakdownReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ metricType?: string }>();
  const selectedKpiType = parseMetricTypeParam(params.metricType);
  const metricTypeForHook = selectedKpiType ?? 'DISPATCH_VOLUME';
  const [selectedPeriod, setSelectedPeriod] = React.useState<KpiBreakdownPeriodKey>('custom');

  React.useEffect(() => {
    setSelectedPeriod('custom');
  }, [selectedKpiType]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/kpi');
  };

  const breakdownData = useKpiBreakdownData({
    metricType: metricTypeForHook,
    selectedPeriod,
    enabled: Boolean(selectedKpiType),
  });

  if (!selectedKpiType) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>KPI Breakdown</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.content}>
          <Card variant="default" padding="base">
            <EmptyState
              icon="alert-circle-outline"
              title="Invalid KPI metric"
              subtitle={`Supported metrics: ${getAvailableKpiRouteMetrics().map((kpi) => formatKpiType(kpi)).join(', ')}`}
              actionLabel="Go to KPI Metrics"
              onAction={() => router.replace('/(tabs)/kpi')}
            />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{formatKpiType(selectedKpiType)}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <KpiBreakdownSummary
          selectedMetric={breakdownData.selectedMetric}
          insight={breakdownData.deterministicInsight}
          isLoading={breakdownData.isLoadingAggregated}
          isError={breakdownData.isAggregatedError}
          onRetry={breakdownData.refetchAll}
        />

        <KpiBreakdownTrend
          metricType={selectedKpiType}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          trendRows={breakdownData.trendRows}
          trendSignal={breakdownData.deterministicInsight?.trendSignal ?? 'insufficient_data'}
          trendDeltaPercent={breakdownData.deterministicInsight?.trendDeltaPercent ?? null}
          isLoading={breakdownData.isLoadingHistory}
          isFetching={breakdownData.isFetchingHistory}
          isError={breakdownData.isHistoryError}
          onRetry={breakdownData.refetchHistory}
        />

        <KpiAiInsights
          metricType={selectedKpiType}
          deterministicInsight={breakdownData.deterministicInsight}
          analysisMetric={breakdownData.aiAnalysisMetric}
          isDataLoading={breakdownData.isLoadingAggregated}
          isDataError={breakdownData.isAggregatedError}
          onRetryData={breakdownData.refetchAggregated}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  content: {
    padding: spacing.base,
    gap: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
});
