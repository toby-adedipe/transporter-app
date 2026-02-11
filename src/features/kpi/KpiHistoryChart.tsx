import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { FilterChip, SkeletonLoader, EmptyState, Card } from '@/components/ui';
import { useGetKpiHistoryQuery } from '@/store/api/kpiApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { formatKpiType } from '@/utils/kpiHelpers';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { KpiType } from '@/types/api';

const KPI_TYPES: KpiType[] = [
  'LOADED_IN_PLANT_TIME',
  'LOADED_NOT_MOVING_TIME',
  'TRUCKS_NOT_TRACKING',
  'TRUCKS_YET_TO_LOAD_7_DAYS_PLUS',
];

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  style: { borderRadius: 12 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
};

export function KpiHistoryChart() {
  const [selectedKpi, setSelectedKpi] = useState<KpiType>(KPI_TYPES[0]);
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading } = useGetKpiHistoryQuery(
    { transporterNumber, kpiType: selectedKpi, startDate, endDate },
    { skip: !transporterNumber },
  );

  const historyData = data?.result as any;
  const dataPoints: number[] = Array.isArray(historyData?.dataPoints)
    ? historyData.dataPoints.map((p: any) => p.value ?? p.score ?? 0)
    : Array.isArray(historyData)
      ? historyData.map((p: any) => p.value ?? p.score ?? 0)
      : [];
  const labels: string[] = Array.isArray(historyData?.dataPoints)
    ? historyData.dataPoints.map((p: any) => p.label ?? p.date?.slice(5, 10) ?? '')
    : Array.isArray(historyData)
      ? historyData.map((p: any) => p.label ?? p.date?.slice(5, 10) ?? '')
      : [];

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
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  chipRow: { flexGrow: 0, marginBottom: spacing.md },
  chart: { borderRadius: 12, marginTop: spacing.sm },
});
