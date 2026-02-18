import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, EmptyState, MetricCard, SkeletonLoader } from '@/components/ui';
import { useGetKpiV2AggregatedQuery } from '@/store/api/kpiApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatKpiType } from '@/utils/kpiHelpers';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';
import type { KpiType } from '@/types/api';

const KPI_TYPE_TO_V2_KEY: Partial<Record<KpiType, string>> = {
  DISPATCH_VOLUME: 'volumeMoved',
  CICO_CUSTOMER: 'totalCico',
  BACKHAUL: 'backhaulVolume',
  OTD_RING_1: 'otd',
  AVG_DISTANCE_PER_TRIP: 'averageDistancePerTrip',
  TRIPS_PER_TRUCK_PER_WEEK: 'tripsPerTruck',
  TI: 'ti',
  TO: 'to',
  AVERAGE_SCORE_CARD: 'averageScoreCard',
  AVAILABILITY: 'availability',
  TOTAL_TRUCKS: 'totalTrucks',
  VIOLATION_RATE: 'violationRate',
  SKMD: 'skmd',
  HRD: 'hrd',
};

const VALID_REGIONS = new Set(['NORTH', 'WEST', 'EAST', 'ALL', 'LAGOS']);

const normalizeMetricKey = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toLowerCase();

const toNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatMetricValue = (value: number | null): string => {
  if (value === null) return '-';
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

type MetricRow = {
  name: string;
  value: number | null;
  expected: number | null;
  variance: number | null;
  unit?: string;
  description?: string;
  formula?: string;
  rankings?: Record<string, string | number | null>;
};

const getMetricValue = (metric: unknown): number | null => {
  if (typeof metric !== 'object' || metric === null) {
    return toNumeric(metric);
  }

  const candidate =
    (metric as any).actual ??
    (metric as any).metricValue ??
    (metric as any).value ??
    (metric as any).score ??
    null;

  return toNumeric(candidate);
};

const getExpectedValue = (metric: unknown): number | null => {
  if (typeof metric !== 'object' || metric === null) {
    return null;
  }
  return toNumeric((metric as any).expected);
};

const getVarianceValue = (metric: unknown): number | null => {
  if (typeof metric !== 'object' || metric === null) {
    return null;
  }
  return toNumeric((metric as any).variance);
};

interface KpiBreakdownSummaryProps {
  selectedKpi?: KpiType;
  selectedMetricName?: string | null;
  onMetricSelect?: (metricName: string) => void;
}

export function KpiBreakdownSummary({
  selectedKpi,
  selectedMetricName,
  onMetricSelect,
}: KpiBreakdownSummaryProps) {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);
  const selectedRegion = useAppSelector((s) => s.filters.selectedRegion);

  const regions =
    selectedRegion && VALID_REGIONS.has(selectedRegion) && selectedRegion !== 'ALL'
      ? ([selectedRegion] as Array<'NORTH' | 'WEST' | 'EAST' | 'LAGOS'>)
      : undefined;

  const { data, isLoading, isError, refetch } = useGetKpiV2AggregatedQuery(
    {
      startDate,
      endDate,
      transporterNumbers: transporterNumber ? [transporterNumber] : undefined,
      regions,
    },
    { skip: !transporterNumber },
  );

  const metricRows = React.useMemo<MetricRow[]>(() => {
    const metricSource = data?.result?.kpiMetrics;
    if (!metricSource || typeof metricSource !== 'object') return [];

    return Object.entries(metricSource)
      .map(([name, metric]) => ({
        name,
        value: getMetricValue(metric),
        expected: getExpectedValue(metric),
        variance: getVarianceValue(metric),
        unit:
          typeof (metric as any)?.unitOfMeasurement === 'string'
            ? (metric as any).unitOfMeasurement
            : undefined,
        description:
          typeof (metric as any)?.kpiDescription === 'string'
            ? (metric as any).kpiDescription
            : undefined,
        formula:
          typeof (metric as any)?.formula === 'string'
            ? (metric as any).formula
            : undefined,
        rankings:
          typeof (metric as any)?.rankings === 'object' && (metric as any).rankings !== null
            ? ((metric as any).rankings as Record<string, string | number | null>)
            : undefined,
      }))
      .filter((item) => item.value !== null || item.expected !== null || item.variance !== null)
      .sort((a, b) => Math.abs(b.variance ?? 0) - Math.abs(a.variance ?? 0));
  }, [data]);

  const preferredMetricName = React.useMemo(() => {
    if (!selectedKpi) return null;
    const preferredKey = KPI_TYPE_TO_V2_KEY[selectedKpi] ?? selectedKpi.toLowerCase();
    return (
      metricRows.find((row) => normalizeMetricKey(row.name) === normalizeMetricKey(preferredKey))?.name ??
      null
    );
  }, [metricRows, selectedKpi]);

  const activeMetricName = React.useMemo(() => {
    if (selectedMetricName) {
      const matched = metricRows.find(
        (row) => normalizeMetricKey(row.name) === normalizeMetricKey(selectedMetricName),
      );
      if (matched) return matched.name;
    }
    if (preferredMetricName) return preferredMetricName;
    return metricRows[0]?.name ?? null;
  }, [metricRows, preferredMetricName, selectedMetricName]);

  React.useEffect(() => {
    if (!activeMetricName || !onMetricSelect) return;
    if (
      selectedMetricName &&
      normalizeMetricKey(selectedMetricName) === normalizeMetricKey(activeMetricName)
    ) {
      return;
    }
    onMetricSelect(activeMetricName);
  }, [activeMetricName, onMetricSelect, selectedMetricName]);

  const selectedMetric = React.useMemo(
    () =>
      activeMetricName
        ? metricRows.find(
            (row) => normalizeMetricKey(row.name) === normalizeMetricKey(activeMetricName),
          ) ?? null
        : null,
    [activeMetricName, metricRows],
  );

  const rankingSummary = React.useMemo(() => {
    if (!selectedMetric?.rankings) return [];
    const orderedWindows = ['1', '7', '30'];
    return orderedWindows
      .map((window) => {
        const value = selectedMetric.rankings?.[window];
        if (value == null || String(value).trim() === '') return null;
        return `${window} day: ${value}`;
      })
      .filter((item): item is string => item !== null);
  }, [selectedMetric]);

  if (isLoading) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Breakdown</Text>
        <View style={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLoader key={i} width="48%" height={96} />
          ))}
        </View>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Breakdown</Text>
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to load KPI breakdown"
          subtitle="Pull to refresh or retry"
          actionLabel="Retry"
          onAction={refetch}
        />
      </Card>
    );
  }

  if (metricRows.length === 0) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>KPI Breakdown</Text>
        <EmptyState
          icon="analytics-outline"
          title="No KPI breakdown data"
          subtitle="Try changing the date range in filters"
        />
      </Card>
    );
  }

  return (
    <Card variant="default" padding="base">
      <Text style={styles.title}>KPI Breakdown</Text>
      <View style={styles.grid}>
        {metricRows.map((item) => {
          const subtitleParts = [
            item.expected !== null ? `Expected: ${formatMetricValue(item.expected)}` : '',
            item.variance !== null ? `Variance: ${formatMetricValue(item.variance)}` : '',
            item.unit ? `Unit: ${item.unit}` : '',
          ].filter(Boolean);

          const isSelected =
            activeMetricName !== null &&
            normalizeMetricKey(item.name) === normalizeMetricKey(activeMetricName);

          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.cardWrapper, isSelected && styles.cardWrapperSelected]}
              onPress={() => onMetricSelect?.(item.name)}
              activeOpacity={0.8}
            >
              <MetricCard
                title={formatKpiType(item.name)}
                value={formatMetricValue(item.value)}
                subtitle={subtitleParts.length > 0 ? subtitleParts.join(' • ') : undefined}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedMetric && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>
            {formatKpiType(selectedMetric.name)} details
          </Text>
          {selectedMetric.description && (
            <Text style={styles.detailsText}>{selectedMetric.description}</Text>
          )}
          <Text style={styles.detailsText}>
            Actual: {formatMetricValue(selectedMetric.value)} {selectedMetric.unit ?? ''}
          </Text>
          <Text style={styles.detailsText}>
            Expected: {formatMetricValue(selectedMetric.expected)}
          </Text>
          <Text style={styles.detailsText}>
            Variance: {formatMetricValue(selectedMetric.variance)}
          </Text>
          {selectedMetric.formula && (
            <Text style={styles.detailsText}>
              Formula: {selectedMetric.formula}
            </Text>
          )}
          {rankingSummary.length > 0 && (
            <Text style={styles.detailsText}>
              Rankings: {rankingSummary.join(' | ')}
            </Text>
          )}
        </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardWrapper: {
    width: '48%',
    flexGrow: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardWrapperSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  detailsContainer: {
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  detailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  detailsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
