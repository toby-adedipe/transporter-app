import { getMetricDirection, getMetricFamily, type KpiMetricFamily } from '@/features/kpi/analysis/metricDirection';
import type {
  KpiContributorMetric,
  KpiDeterministicInsight,
  KpiInsightSeverity,
  KpiRecommendedAction,
  KpiTrendSignal,
} from '@/types/api';

interface InsightEngineInput {
  metricKey: string;
  metricLabel: string;
  actual: number | null;
  expected: number | null;
  contributors: KpiContributorMetric[];
  trendValues: number[];
}

const SEVERITY_LABELS: Record<KpiInsightSeverity, string> = {
  healthy: 'Healthy',
  warning: 'Watch',
  critical: 'Needs Attention',
  unknown: 'Info',
};

const ACTION_COPY: Record<KpiMetricFamily, [string, string, string]> = {
  delivery: [
    'Prioritize delayed lanes and dispatch windows with late start times first.',
    'Set early escalation for trips crossing the midpoint without milestone updates.',
    'Review plant-to-customer handoff delays and fix top recurring blockers this week.',
  ],
  safety: [
    'Coach high-risk operators first and track daily behavior change on flagged routes.',
    'Run safety compliance checks at shift start and resolve missing requirements immediately.',
    'Open root-cause actions for recurring violations and close owners with due dates.',
  ],
  turnaround: [
    'Reduce queue time at loading and offloading points using time-slice scheduling.',
    'Track dwell-time exceptions every shift and assign owners to the top 3 bottlenecks.',
    'Align gate, dispatch, and yard teams on a shared turnaround SLA for this metric.',
  ],
  utilization: [
    'Rebalance truck assignment toward low-utilization assets before adding new capacity.',
    'Increase trip density by pairing outbound and return loads on compatible lanes.',
    'Track idle windows daily and convert long idle blocks into scheduled movements.',
  ],
  cost: [
    'Review high-cost lanes and apply route or load-consolidation corrections immediately.',
    'Set variance guardrails for freight spend and trigger approval on outlier trips.',
    'Pair cost tracking with payload and trip efficiency to reduce spend per delivered unit.',
  ],
  productivity: [
    'Focus operational reviews on the lowest-performing depots or route clusters first.',
    'Standardize loading and movement practices from top-performing teams across shifts.',
    'Set a weekly target uplift for this KPI and monitor progress in daily huddles.',
  ],
};

const formatNumber = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '-';
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
};

const toTopContributors = (contributors: KpiContributorMetric[]): KpiContributorMetric[] => {
  const score = (item: KpiContributorMetric): number => {
    if (typeof item.variance === 'number' && Number.isFinite(item.variance)) {
      return Math.abs(item.variance);
    }

    if (
      typeof item.actual === 'number' &&
      Number.isFinite(item.actual) &&
      typeof item.expected === 'number' &&
      Number.isFinite(item.expected)
    ) {
      return Math.abs(item.actual - item.expected);
    }

    return 0;
  };

  return [...contributors]
    .filter((item) => item.actual !== null || item.expected !== null || item.variance !== null)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3);
};

const resolveTrendSignal = (
  metricKey: string,
  trendValues: number[],
): { trendSignal: KpiTrendSignal; trendDeltaPercent: number | null } => {
  if (trendValues.length < 2) {
    return { trendSignal: 'insufficient_data', trendDeltaPercent: null };
  }

  const baselineWindow = trendValues.slice(0, Math.min(3, trendValues.length));
  const baselineAverage = baselineWindow.reduce((acc, value) => acc + value, 0) / baselineWindow.length;
  const latest = trendValues[trendValues.length - 1];
  const trendDeltaPercent = ((latest - baselineAverage) / Math.max(Math.abs(baselineAverage), 1)) * 100;

  if (Math.abs(trendDeltaPercent) <= 3) {
    return { trendSignal: 'stable', trendDeltaPercent };
  }

  const direction = getMetricDirection(metricKey);
  const isImproving =
    (direction === 'higher_is_better' && trendDeltaPercent > 0) ||
    (direction === 'lower_is_better' && trendDeltaPercent < 0);

  return {
    trendSignal: isImproving ? 'improving' : 'declining',
    trendDeltaPercent,
  };
};

const resolveSeverity = (
  actual: number | null,
  expected: number | null,
): { severity: KpiInsightSeverity; gapToTarget: number | null; gapRatio: number | null } => {
  if (actual === null || expected === null) {
    return { severity: 'unknown', gapToTarget: null, gapRatio: null };
  }

  const gapToTarget = actual - expected;
  const gapRatio = Math.abs(gapToTarget) / Math.max(Math.abs(expected), 1);

  if (gapRatio < 0.05) {
    return { severity: 'healthy', gapToTarget, gapRatio };
  }

  if (gapRatio <= 0.15) {
    return { severity: 'warning', gapToTarget, gapRatio };
  }

  return { severity: 'critical', gapToTarget, gapRatio };
};

const buildActions = (metricKey: string): KpiRecommendedAction[] => {
  const family = getMetricFamily(metricKey);
  return ACTION_COPY[family].map((description, index) => ({
    id: `${family}-${index + 1}`,
    title: `Action ${index + 1}`,
    description,
  }));
};

const buildSummary = (
  metricLabel: string,
  actual: number | null,
  expected: number | null,
  gapToTarget: number | null,
  trendSignal: KpiTrendSignal,
): string => {
  if (actual === null) {
    return `${metricLabel} has no current value for this date range.`;
  }

  if (expected === null || gapToTarget === null) {
    return `${metricLabel} is at ${formatNumber(actual)} with no configured target baseline.`;
  }

  const directionWord = gapToTarget >= 0 ? 'above' : 'below';
  const trendText =
    trendSignal === 'improving'
      ? 'Trend is improving.'
      : trendSignal === 'declining'
        ? 'Trend is declining.'
        : trendSignal === 'stable'
          ? 'Trend is stable.'
          : 'Trend data is limited.';

  return `${metricLabel} is ${formatNumber(Math.abs(gapToTarget))} ${directionWord} target (${formatNumber(actual)} vs ${formatNumber(expected)}). ${trendText}`;
};

export function buildKpiDeterministicInsight(input: InsightEngineInput): KpiDeterministicInsight {
  const topContributors = toTopContributors(input.contributors);
  const { trendSignal, trendDeltaPercent } = resolveTrendSignal(input.metricKey, input.trendValues);
  const { severity, gapToTarget, gapRatio } = resolveSeverity(input.actual, input.expected);
  const actions = buildActions(input.metricKey);
  const summary = buildSummary(
    input.metricLabel,
    input.actual,
    input.expected,
    gapToTarget,
    trendSignal,
  );

  return {
    severity,
    trendSignal,
    headline: `${SEVERITY_LABELS[severity]} ${input.metricLabel}`,
    summary,
    gapToTarget,
    gapRatio,
    trendDeltaPercent,
    topContributors,
    actions,
  };
}
