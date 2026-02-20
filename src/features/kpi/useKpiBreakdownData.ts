import React from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { getContributorKeysForKpi, KPI_METRIC_LABELS } from '@/features/kpi/kpiContributorMap';
import { buildKpiDeterministicInsight } from '@/features/kpi/analysis/kpiInsightEngine';
import { useGetKpiHistoryQuery, useGetKpiV2AggregatedQuery } from '@/store/api/kpiApi';
import { toAggregatedMetricKey, toHistoryKpiType } from '@/utils/kpiRouting';
import { formatKpiType } from '@/utils/kpiHelpers';
import type {
  KpiAiAnalysisMetric,
  KpiContributorMetric,
  KpiDeterministicInsight,
  KpiHistoryPoint,
  KpiType,
} from '@/types/api';

const VALID_REGIONS = new Set(['NORTH', 'WEST', 'EAST', 'ALL', 'LAGOS']);

export const KPI_BREAKDOWN_PERIOD_OPTIONS: Array<{
  key: 'custom' | 'annual' | 'last_six_months' | 'last_three_months' | 'monthly';
  label: string;
}> = [
  { key: 'custom', label: 'Custom' },
  { key: 'annual', label: 'Annual' },
  { key: 'last_six_months', label: 'Last 6 months' },
  { key: 'last_three_months', label: 'Last 3 months' },
  { key: 'monthly', label: 'Monthly' },
];

export type KpiBreakdownPeriodKey = (typeof KPI_BREAKDOWN_PERIOD_OPTIONS)[number]['key'];

interface DateRange {
  startDate: string;
  endDate: string;
}

export interface KpiBreakdownSelectedMetric {
  key: string;
  title: string;
  actual: number | null;
  expected: number | null;
  variance: number | null;
  unit: string;
  description: string;
  formula: string;
  rankings?: Record<string, string | number | null>;
}

export interface KpiBreakdownTrendRow {
  label: string;
  value: number;
  rawValue: number | null;
}

interface UseKpiBreakdownDataArgs {
  metricType: KpiType;
  selectedPeriod: KpiBreakdownPeriodKey;
  enabled?: boolean;
}

const toNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getMetricValue = (metric: unknown): number | null => {
  if (typeof metric !== 'object' || metric === null) {
    return toNumeric(metric);
  }
  return toNumeric(
    (metric as any).actual ??
      (metric as any).metricValue ??
      (metric as any).value ??
      (metric as any).score,
  );
};

const getExpectedValue = (metric: unknown): number | null => {
  if (typeof metric !== 'object' || metric === null) return null;
  return toNumeric((metric as any).expected);
};

const getVarianceValue = (metric: unknown): number | null => {
  if (typeof metric !== 'object' || metric === null) return null;
  return toNumeric((metric as any).variance);
};

const getPointLabel = (entry: KpiHistoryPoint, fallbackIndex: number): string => {
  const raw =
    entry.calculationWindowStart ??
    entry.period ??
    entry.date ??
    entry.startDate ??
    entry.windowStart ??
    '';

  if (typeof raw === 'string' && raw) {
    return raw.length >= 10 ? raw.slice(5, 10) : raw;
  }
  return String(fallbackIndex + 1);
};

const getHistoryPointValue = (entry: KpiHistoryPoint): number | null =>
  toNumeric(entry.metricValue ?? entry.actual ?? entry.value ?? entry.score ?? null);

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

export const resolveDateRange = (
  period: KpiBreakdownPeriodKey,
  customStartDate: string,
  customEndDate: string,
): DateRange => {
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

export function useKpiBreakdownData({
  metricType,
  selectedPeriod,
  enabled = true,
}: UseKpiBreakdownDataArgs) {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);
  const selectedRegion = useAppSelector((s) => s.filters.selectedRegion);

  const range = React.useMemo(
    () => resolveDateRange(selectedPeriod, startDate, endDate),
    [selectedPeriod, startDate, endDate],
  );

  const regions =
    selectedRegion && VALID_REGIONS.has(selectedRegion) && selectedRegion !== 'ALL'
      ? ([selectedRegion] as Array<'NORTH' | 'WEST' | 'EAST' | 'LAGOS'>)
      : undefined;

  const {
    data: aggregatedData,
    isLoading: isLoadingAggregated,
    isFetching: isFetchingAggregated,
    isError: isAggregatedError,
    refetch: refetchAggregated,
  } = useGetKpiV2AggregatedQuery(
    {
      startDate,
      endDate,
      transporterNumbers: transporterNumber ? [transporterNumber] : undefined,
      regions,
    },
    { skip: !enabled || !transporterNumber },
  );

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useGetKpiHistoryQuery(
    {
      transporterNumber,
      kpiType: toHistoryKpiType(metricType),
      startDate: range.startDate,
      endDate: range.endDate,
    },
    { skip: !enabled || !transporterNumber },
  );

  const metricSource = aggregatedData?.result?.kpiMetrics ?? null;
  const selectedMetricKey = toAggregatedMetricKey(metricType);
  const selectedMetricRaw =
    metricSource && typeof metricSource === 'object'
      ? (metricSource as Record<string, unknown>)[selectedMetricKey]
      : null;

  const selectedMetric = React.useMemo<KpiBreakdownSelectedMetric | null>(() => {
    if (!selectedMetricRaw) return null;
    return {
      key: selectedMetricKey,
      title: KPI_METRIC_LABELS[selectedMetricKey] ?? formatKpiType(selectedMetricKey),
      actual: getMetricValue(selectedMetricRaw),
      expected: getExpectedValue(selectedMetricRaw),
      variance: getVarianceValue(selectedMetricRaw),
      unit:
        typeof (selectedMetricRaw as any)?.unitOfMeasurement === 'string'
          ? (selectedMetricRaw as any).unitOfMeasurement
          : '',
      description:
        typeof (selectedMetricRaw as any)?.kpiDescription === 'string'
          ? (selectedMetricRaw as any).kpiDescription
          : '',
      formula:
        typeof (selectedMetricRaw as any)?.formula === 'string'
          ? (selectedMetricRaw as any).formula
          : '',
      rankings:
        typeof (selectedMetricRaw as any)?.rankings === 'object' &&
        (selectedMetricRaw as any).rankings !== null
          ? ((selectedMetricRaw as any).rankings as Record<string, string | number | null>)
          : undefined,
    };
  }, [selectedMetricKey, selectedMetricRaw]);

  const contributors = React.useMemo<KpiContributorMetric[]>(() => {
    if (!metricSource || typeof metricSource !== 'object') return [];
    const keys = getContributorKeysForKpi(metricType);

    return keys.reduce<KpiContributorMetric[]>((acc, key) => {
      const raw = (metricSource as Record<string, unknown>)[key];
      if (!raw) return acc;

      const actual = getMetricValue(raw);
      const expected = getExpectedValue(raw);
      const variance = getVarianceValue(raw);
      if (actual === null && expected === null && variance === null) return acc;

      acc.push({
        key,
        label: KPI_METRIC_LABELS[key] ?? formatKpiType(key),
        actual,
        expected,
        variance,
        unit: typeof (raw as any)?.unitOfMeasurement === 'string' ? (raw as any).unitOfMeasurement : undefined,
        description: typeof (raw as any)?.kpiDescription === 'string' ? (raw as any).kpiDescription : undefined,
      });
      return acc;
    }, []);
  }, [metricSource, metricType]);

  const trendRows = React.useMemo<KpiBreakdownTrendRow[]>(() => {
    const rawResult = historyData?.result;
    const history: KpiHistoryPoint[] = Array.isArray(rawResult)
      ? rawResult
      : Array.isArray(rawResult?.history)
        ? rawResult.history
        : [];

    return history.map((entry, index) => {
      const rawValue = getHistoryPointValue(entry);
      return {
        label: getPointLabel(entry, index),
        value: rawValue ?? 0,
        rawValue,
      };
    });
  }, [historyData]);

  const deterministicInsight = React.useMemo<KpiDeterministicInsight | null>(() => {
    if (!selectedMetric) return null;
    return buildKpiDeterministicInsight({
      metricKey: selectedMetric.key,
      metricLabel: selectedMetric.title,
      actual: selectedMetric.actual,
      expected: selectedMetric.expected,
      contributors,
      trendValues: trendRows.map((entry) => entry.value),
    });
  }, [contributors, selectedMetric, trendRows]);

  const aiAnalysisMetric = React.useMemo<KpiAiAnalysisMetric | null>(() => {
    if (!selectedMetric || selectedMetric.actual === null) return null;
    const expected = selectedMetric.expected ?? 0;
    return {
      name: selectedMetric.key,
      description: selectedMetric.description || selectedMetric.title,
      actual: selectedMetric.actual,
      expected,
      variance: selectedMetric.variance ?? selectedMetric.actual - expected,
      unit: selectedMetric.unit,
    };
  }, [selectedMetric]);

  const refetchAll = React.useCallback(() => {
    refetchAggregated();
    refetchHistory();
  }, [refetchAggregated, refetchHistory]);

  return {
    range,
    selectedMetric,
    contributors,
    trendRows,
    deterministicInsight,
    aiAnalysisMetric,
    isLoadingAggregated,
    isFetchingAggregated,
    isAggregatedError,
    isLoadingHistory,
    isFetchingHistory,
    isHistoryError,
    isLoading: isLoadingAggregated || isLoadingHistory,
    isError: isAggregatedError || isHistoryError,
    refetchAggregated,
    refetchHistory,
    refetchAll,
  };
}
