import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { FilterChip, SkeletonLoader, EmptyState, Card } from '@/components/ui';
import { useGetKpiHistoryQuery } from '@/store/api/kpiApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { formatKpiType } from '@/utils/kpiHelpers';
import { colors, spacing, fontSize, fontWeight, fontFamily } from '@/constants/theme';
import type { KpiHistoryPoint, KpiType } from '@/types/api';

const KPI_TYPES: KpiType[] = [
  'DISPATCH_VOLUME',
  'GIGO',
  'CICO_CUSTOMER',
  'LEAD_TIME',
  'OTD_RING_1',
  'AVERAGE_SCORE_CARD',
  'AVAILABILITY',
  'VIOLATION_RATE',
];

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(75, 106, 155, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 122, 141, ${opacity})`,
  fillShadowGradient: '#4B6A9B',
  fillShadowGradientOpacity: 0.15,
  strokeWidth: 2.5,
  style: { borderRadius: 12 },
  propsForDots: { r: '5', strokeWidth: '2.5', stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '' },
};

export function KpiHistoryChart() {
  const [selectedKpi, setSelectedKpi] = useState<KpiType>(KPI_TYPES[0]);
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading } = useGetKpiHistoryQuery(
    { transporterNumber, kpiType: selectedKpi, startDate, endDate },
    { skip: !transporterNumber },
  );

  const historyResult = data?.result;
  const history: KpiHistoryPoint[] = Array.isArray(historyResult)
    ? historyResult
    : Array.isArray(historyResult?.history)
      ? historyResult.history
      : [];
  const dataPoints: number[] = history.map((p) => {
    const value = p.metricValue ?? p.value ?? p.score ?? p.actual ?? 0;
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  });
  const labels: string[] = history.map((p) => {
    const dateStr = p.calculationWindowStart ?? p.date ?? p.startDate ?? '';
    return dateStr ? dateStr.slice(5, 10) : '';
  });

  const hasData = dataPoints.length > 0;

  return (
    <Card variant="default" padding="base">
      <Text style={styles.title}>KPI History</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {KPI_TYPES.map((kpi) => (
          <FilterChip
            key={kpi}
            label={formatKpiType(kpi).substring(0, 20)}
            selected={selectedKpi === kpi}
            onPress={() => setSelectedKpi(kpi)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <SkeletonLoader width="100%" height={200} />
      ) : hasData ? (
        <LineChart
          data={{
            labels: labels.length > 6 ? labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0) : labels,
            datasets: [{ data: dataPoints.length > 0 ? dataPoints : [0] }],
          }}
          width={screenWidth - spacing.base * 4}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      ) : (
        <EmptyState icon="analytics-outline" title="No history data" subtitle="Select a different KPI or time range" />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipRow: { flexGrow: 0, marginBottom: spacing.base },
  chart: { borderRadius: 12, marginTop: spacing.sm },
});
