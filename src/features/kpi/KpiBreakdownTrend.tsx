import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { FilterChip, Card, EmptyState, SkeletonLoader } from '@/components/ui';
import { useGetKpiHistoryQuery } from '@/store/api/kpiApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatKpiType } from '@/utils/kpiHelpers';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { KpiType } from '@/types/api';

const KPI_TYPES: KpiType[] = [
  'DISPATCH_VOLUME',
  'GIGO',
  'CICO_CUSTOMER',
  'LEAD_TIME',
  'OTD_RING_1',
  'AVERAGE_SCORE_CARD',
  'AVAILABILITY',
  'VIOLATION_RATE',
  'BACKHAUL',
  'TRIPS_PER_TRUCK_PER_WEEK',
  'TO',
  'TI',
  'TOTAL_TRUCKS',
  'AVG_DISTANCE_PER_TRIP',
  'SKMD',
  'HRD',
];

const PERIOD_OPTIONS: Array<{
  key: 'custom' | 'annual' | 'last_six_months' | 'last_three_months' | 'monthly';
  label: string;
}> = [
  { key: 'custom', label: 'Custom' },
  { key: 'annual', label: 'Annual' },
  { key: 'last_six_months', label: 'Last 6 months' },
  { key: 'last_three_months', label: 'Last 3 months' },
  { key: 'monthly', label: 'Monthly' },
];

type PeriodKey = (typeof PERIOD_OPTIONS)[number]['key'];
type TrendRow = { label: string; value: number };

const CHART_WIDTH = Dimensions.get('window').width - spacing.base * 3;

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

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string): Date => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const resolveDateRange = (
  period: PeriodKey,
  customStartDate: string,
  customEndDate: string,
): { startDate: string; endDate: string } => {
  if (period === 'custom') {
    return { startDate: customStartDate, endDate: customEndDate };
  }

  const end = parseDate(customEndDate);
  const start = new Date(end);

  switch (period) {
    case 'annual':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'last_six_months':
      start.setMonth(end.getMonth() - 6);
      break;
    case 'last_three_months':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'monthly':
      start.setMonth(end.getMonth() - 1);
      break;
    default:
      break;
  }

  if (start > end) {
    return { startDate: toIsoDate(end), endDate: toIsoDate(end) };
  }

  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
};

const toNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getMetricValue = (payload: unknown): number | null => {
  if (payload == null) return null;
  const direct = toNumeric(payload);
  if (direct !== null) return direct;
  if (typeof payload !== 'object') return null;

  const item = payload as Record<string, unknown>;
  const candidate = item.metricValue ?? item.actual ?? item.value ?? item.score ?? null;
  return toNumeric(candidate);
};

const getPointLabel = (entry: any): string => {
  const raw =
    entry?.calculationWindowStart ??
    entry?.period ??
    entry?.date ??
    entry?.startDate ??
    entry?.windowStart ??
    '';

  if (typeof raw === 'string' && raw) {
    return raw.length >= 10 ? raw.slice(5, 10) : raw;
  }
  return '';
};

const formatMetricValue = (value: number | null): string => {
  if (value === null) return '-';
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

interface KpiBreakdownTrendProps {
  selectedKpi?: KpiType;
}

export function KpiBreakdownTrend({ selectedKpi: initialSelectedKpi }: KpiBreakdownTrendProps) {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const [selectedKpi, setSelectedKpi] = useState<KpiType>(KPI_TYPES[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('custom');

  useEffect(() => {
    if (initialSelectedKpi && KPI_TYPES.includes(initialSelectedKpi)) {
      setSelectedKpi(initialSelectedKpi);
    }
  }, [initialSelectedKpi]);

  const range = useMemo(
    () => resolveDateRange(selectedPeriod, startDate, endDate),
    [selectedPeriod, startDate, endDate],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetKpiHistoryQuery(
    {
      transporterNumber,
      kpiType: selectedKpi,
      startDate: range.startDate,
      endDate: range.endDate,
    },
    { skip: !transporterNumber },
  );

  const trendRows = useMemo<TrendRow[]>(() => {
    const rawResult = data?.result as any;
    const history: any[] = Array.isArray(rawResult?.history)
      ? rawResult.history
      : Array.isArray(rawResult)
        ? rawResult
        : [];

    return history.map((entry, index) => {
      const label = getPointLabel(entry) || String(index + 1);
      const value = getMetricValue(entry);
      return { label, value: value ?? 0 };
    });
  }, [data]);

  const chartPoints = trendRows.map((item) => item.value);
  const chartLabels =
    trendRows.length > 6
      ? trendRows
          .filter((_, index) => index % Math.ceil(trendRows.length / 6) === 0)
          .map((point) => point.label)
      : trendRows.map((point) => point.label);

  if (isLoading) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Trend Breakdown</Text>
        <SkeletonLoader width="100%" height={48} />
        <SkeletonLoader width="100%" height={200} style={{ marginTop: spacing.md }} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Trend Breakdown</Text>
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to load trend data"
          subtitle="Pull to refresh and try again"
          actionLabel="Retry"
          onAction={refetch}
        />
      </Card>
    );
  }

  return (
    <Card variant="default" padding="base">
      <Text style={styles.title}>KPI Trend Breakdown</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {PERIOD_OPTIONS.map((period) => (
          <FilterChip
            key={period.key}
            label={period.label}
            selected={selectedPeriod === period.key}
            onPress={() => setSelectedPeriod(period.key)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {KPI_TYPES.map((kpi) => (
          <FilterChip
            key={kpi}
            label={formatKpiType(kpi).substring(0, 18)}
            selected={selectedKpi === kpi}
            onPress={() => setSelectedKpi(kpi)}
          />
        ))}
      </ScrollView>

      {trendRows.length === 0 ? (
        <EmptyState icon="bar-chart-outline" title="No trend data" subtitle="Try a different period or KPI type" />
      ) : (
        <>
          <LineChart
            data={{ labels: chartLabels, datasets: [{ data: chartPoints.length > 0 ? chartPoints : [0] }] }}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
          <FlatList
            data={trendRows}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>{item.label || '-'}</Text>
                <Text style={styles.listValue}>{formatMetricValue(item.value)}</Text>
              </View>
            )}
            contentContainerStyle={styles.list}
            keyExtractor={(item, index) => `${item.label || 'period'}-${index}`}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chipRow: { flexGrow: 0, marginBottom: spacing.sm },
  chart: { borderRadius: 12, marginTop: spacing.sm },
  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  listValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});
