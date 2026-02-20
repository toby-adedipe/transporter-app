import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, SkeletonLoader } from '@/components/ui';
import { AI_INSIGHTS_API_KEY, AI_INSIGHTS_URL } from '@/constants/config';
import { colors, fontSize, fontWeight, fontFamily, spacing, borderRadius } from '@/constants/theme';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAnalyzeKpiMetricsMutation } from '@/store/api/kpiApi';
import { formatKpiType } from '@/utils/kpiHelpers';
import type {
  KpiAiAnalysisMetric,
  KpiDeterministicInsight,
  KpiType,
} from '@/types/api';

interface KpiAiInsightsProps {
  metricType: KpiType;
  deterministicInsight: KpiDeterministicInsight | null;
  analysisMetric: KpiAiAnalysisMetric | null;
  isDataLoading: boolean;
  isDataError: boolean;
  onRetryData: () => void;
}

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

export function KpiAiInsights({
  metricType,
  deterministicInsight,
  analysisMetric,
  isDataLoading,
  isDataError,
  onRetryData,
}: KpiAiInsightsProps) {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const [analyzeKpiMetrics, { data, isLoading: isAnalyzing, isError, error }] =
    useAnalyzeKpiMetricsMutation();

  const isConfigured = Boolean(AI_INSIGHTS_URL && AI_INSIGHTS_API_KEY);

  const runAnalysis = React.useCallback(() => {
    if (!transporterNumber || !analysisMetric) return;
    setIsExpanded(true);
    analyzeKpiMetrics({
      transporterNumber,
      startDate,
      endDate,
      metrics: [analysisMetric],
    });
  }, [analysisMetric, analyzeKpiMetrics, endDate, startDate, transporterNumber]);

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

  return (
    <Card variant="default" padding="base">
      <Text style={styles.title}>AI KPI Analysis</Text>
      <Text style={styles.subtitle}>Optional deep analysis for {formatKpiType(metricType)}</Text>

      {deterministicInsight ? (
        <View style={styles.deterministicBox}>
          <Text style={styles.deterministicTitle}>Deterministic baseline</Text>
          <Text style={styles.deterministicText}>{deterministicInsight.summary}</Text>
        </View>
      ) : null}

      {isDataLoading ? (
        <View style={styles.blockSpacing}>
          <SkeletonLoader width="100%" height={40} />
          <SkeletonLoader width="100%" height={100} style={{ marginTop: spacing.md }} />
        </View>
      ) : isDataError ? (
        <View style={styles.blockSpacing}>
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to prepare KPI data"
            subtitle="Retry to load KPI metrics before running AI analysis"
            actionLabel="Retry"
            onAction={onRetryData}
          />
        </View>
      ) : !analysisMetric ? (
        <View style={styles.blockSpacing}>
          <EmptyState
            icon="analytics-outline"
            title="Selected metric is unavailable"
            subtitle="Choose another KPI metric and try again"
          />
        </View>
      ) : !isConfigured ? (
        <View style={styles.blockSpacing}>
          <EmptyState
            icon="sparkles-outline"
            title="AI analysis is not configured"
            subtitle="Set EXPO_PUBLIC_AI_INSIGHTS_URL and EXPO_PUBLIC_AI_INSIGHTS_API_KEY"
          />
        </View>
      ) : (
        <>
          <View style={styles.actionsRow}>
            <Button
              title={hasAnalysis ? 'Analyze again' : 'Generate AI analysis'}
              onPress={runAnalysis}
              loading={isAnalyzing}
              fullWidth
            />
            {hasAnalysis ? (
              <Button
                title={isExpanded ? 'Hide AI details' : 'Show AI details'}
                onPress={() => setIsExpanded((prev) => !prev)}
                variant="ghost"
                fullWidth
              />
            ) : null}
          </View>

          {isError ? <Text style={styles.errorText}>{getErrorMessage(error)}</Text> : null}

          {isExpanded && hasAnalysis ? (
            <View style={styles.analysisContainer}>
              {summary.trim().length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Summary</Text>
                  <Text style={styles.sectionBody}>{summary.trim()}</Text>
                </View>
              ) : null}

              {insights.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Insights</Text>
                  {insights.map((item, index) => (
                    <Text key={`insight-${index}`} style={styles.bulletText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              ) : null}

              {recommendations.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommendations</Text>
                  {recommendations.map((item, index) => (
                    <Text key={`recommendation-${index}`} style={styles.bulletText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  deterministicBox: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  deterministicTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deterministicText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  blockSpacing: {
    marginTop: spacing.xs,
  },
  actionsRow: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  analysisContainer: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  sectionBody: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingLeft: spacing.sm,
  },
});
