import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, SkeletonLoader } from '@/components/ui';
import { AI_INSIGHTS_API_KEY, AI_INSIGHTS_URL } from '@/constants/config';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAnalyzeKpiMetricsMutation, useGetKpiV2AggregatedQuery } from '@/store/api/kpiApi';
import { formatKpiType } from '@/utils/kpiHelpers';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import type { KpiAiAnalysisMetric } from '@/types/api';

const VALID_REGIONS = new Set(['NORTH', 'WEST', 'EAST', 'ALL', 'LAGOS']);
const MAX_ANALYSIS_METRICS = 20;

const normalizeMetricKey = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toLowerCase();

const toNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'Unable to analyze KPI metrics right now';
  if ('error' in error && typeof (error as any).error === 'string') return (error as any).error;

  const dataMessage = (error as any)?.data?.message;
  if (typeof dataMessage === 'string' && dataMessage.trim()) return dataMessage;

  return 'Unable to analyze KPI metrics right now';
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim());
};

interface KpiAiInsightsProps {
  selectedMetricName?: string | null;
}

export function KpiAiInsights({ selectedMetricName }: KpiAiInsightsProps) {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);
  const selectedRegion = useAppSelector((s) => s.filters.selectedRegion);
  const [lastAutoAnalysisKey, setLastAutoAnalysisKey] = React.useState<string | null>(null);
  const [analysisScopeLabel, setAnalysisScopeLabel] = React.useState<string>('all metrics');

  const regions =
    selectedRegion && VALID_REGIONS.has(selectedRegion) && selectedRegion !== 'ALL'
      ? ([selectedRegion] as Array<'NORTH' | 'WEST' | 'EAST' | 'LAGOS'>)
      : undefined;

  const {
    data: aggregatedData,
    isLoading: isLoadingAggregated,
    isError: isAggregatedError,
    refetch: refetchAggregated,
  } = useGetKpiV2AggregatedQuery(
    {
      startDate,
      endDate,
      transporterNumbers: transporterNumber ? [transporterNumber] : undefined,
      regions,
    },
    { skip: !transporterNumber },
  );

  const allAnalysisMetrics = React.useMemo<KpiAiAnalysisMetric[]>(() => {
    const metricSource = aggregatedData?.result?.kpiMetrics;
    if (!metricSource || typeof metricSource !== 'object') return [];

    return Object.entries(metricSource)
      .map(([name, value]) => {
        const actual = toNumeric((value as any)?.actual);
        if (actual === null) return null;

        const expected = toNumeric((value as any)?.expected) ?? 0;
        const rawVariance = toNumeric((value as any)?.variance);

        return {
          name,
          description:
            typeof (value as any)?.kpiDescription === 'string' && (value as any).kpiDescription
              ? (value as any).kpiDescription
              : formatKpiType(name),
          actual,
          expected,
          variance: rawVariance ?? actual - expected,
          unit:
            typeof (value as any)?.unitOfMeasurement === 'string'
              ? (value as any).unitOfMeasurement
              : '',
        };
      })
      .filter((item): item is KpiAiAnalysisMetric => item !== null)
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }, [aggregatedData]);

  const analysisMetrics = React.useMemo(
    () => allAnalysisMetrics.slice(0, MAX_ANALYSIS_METRICS),
    [allAnalysisMetrics],
  );

  const selectedMetric = React.useMemo(() => {
    if (!selectedMetricName) return null;
    return (
      allAnalysisMetrics.find(
        (metric) => normalizeMetricKey(metric.name) === normalizeMetricKey(selectedMetricName),
      ) ?? null
    );
  }, [allAnalysisMetrics, selectedMetricName]);

  const [analyzeKpiMetrics, { data, isLoading: isAnalyzing, isError, error }] =
    useAnalyzeKpiMetricsMutation();

  const isConfigured = Boolean(AI_INSIGHTS_URL && AI_INSIGHTS_API_KEY);

  const runAnalysis = React.useCallback(
    (metrics: KpiAiAnalysisMetric[], scopeLabel: string) => {
      if (!transporterNumber || metrics.length === 0) return;
      setAnalysisScopeLabel(scopeLabel);
      analyzeKpiMetrics({
        transporterNumber,
        startDate,
        endDate,
        metrics,
      });
    },
    [analyzeKpiMetrics, endDate, startDate, transporterNumber],
  );

  React.useEffect(() => {
    if (!selectedMetric || !transporterNumber || !isConfigured) return;

    const autoKey = `${transporterNumber}:${startDate}:${endDate}:${selectedMetric.name}`;
    if (lastAutoAnalysisKey === autoKey) return;

    setLastAutoAnalysisKey(autoKey);
    runAnalysis([selectedMetric], formatKpiType(selectedMetric.name));
  }, [
    endDate,
    isConfigured,
    lastAutoAnalysisKey,
    runAnalysis,
    selectedMetric,
    startDate,
    transporterNumber,
  ]);

  const analysisResult = data?.result;
  const summary =
    typeof analysisResult?.summary === 'string'
      ? analysisResult.summary
      : typeof (analysisResult as any)?.analysis === 'string'
        ? (analysisResult as any).analysis
        : '';
  const insights = toStringArray((analysisResult as any)?.insights);
  const recommendations = toStringArray((analysisResult as any)?.recommendations);
  const hasAnalysis = summary.trim().length > 0 || insights.length > 0 || recommendations.length > 0;

  if (!isConfigured) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>AI KPI Analysis</Text>
        <EmptyState
          icon="sparkles-outline"
          title="AI analysis is not configured"
          subtitle="Set EXPO_PUBLIC_AI_INSIGHTS_URL and EXPO_PUBLIC_AI_INSIGHTS_API_KEY"
        />
      </Card>
    );
  }

  if (isLoadingAggregated) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>AI KPI Analysis</Text>
        <SkeletonLoader width="100%" height={40} />
        <SkeletonLoader width="100%" height={140} style={{ marginTop: spacing.md }} />
      </Card>
    );
  }

  if (isAggregatedError) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>AI KPI Analysis</Text>
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to prepare KPI data"
          subtitle="Retry to load KPI metrics before requesting AI analysis"
          actionLabel="Retry"
          onAction={refetchAggregated}
        />
      </Card>
    );
  }

  if (analysisMetrics.length === 0) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>AI KPI Analysis</Text>
        <EmptyState
          icon="analytics-outline"
          title="No KPI metrics available"
          subtitle="Adjust filters and try again"
        />
      </Card>
    );
  }

  return (
    <Card variant="default" padding="base">
      <Text style={styles.title}>AI KPI Analysis</Text>
      <Text style={styles.subtitle}>
        {selectedMetric
          ? `Auto-analyzing ${formatKpiType(selectedMetric.name)} whenever you tap a KPI tile.`
          : `Tap a KPI tile to run targeted analysis. You can also run all metrics manually.`}
      </Text>

      <Button
        title={selectedMetric ? 'Analyze selected metric again' : 'Analyze all KPI metrics'}
        onPress={() =>
          selectedMetric
            ? runAnalysis([selectedMetric], formatKpiType(selectedMetric.name))
            : runAnalysis(analysisMetrics, 'all metrics')
        }
        loading={isAnalyzing}
        fullWidth
      />

      {selectedMetric && (
        <View style={styles.helperRow}>
          <Button
            title="Analyze all KPI metrics"
            onPress={() => runAnalysis(analysisMetrics, 'all metrics')}
            variant="outline"
            size="sm"
            fullWidth
          />
        </View>
      )}

      {isError && <Text style={styles.errorText}>{getErrorMessage(error)}</Text>}

      {hasAnalysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.scopeText}>Scope: {analysisScopeLabel}</Text>

          {summary.trim().length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <Text style={styles.sectionBody}>{summary.trim()}</Text>
            </View>
          )}

          {insights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insights</Text>
              {insights.map((item, index) => (
                <Text key={`insight-${index}`} style={styles.bulletText}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {recommendations.map((item, index) => (
                <Text key={`recommendation-${index}`} style={styles.bulletText}>
                  • {item}
                </Text>
              ))}
            </View>
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  helperRow: {
    marginTop: spacing.sm,
  },
  scopeText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  analysisContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
