import type { KpiType } from '@/types/api';

export const KPI_TYPES: KpiType[] = [
  'DISPATCH_VOLUME',
  'GIGO',
  'CICO_CUSTOMER',
  'BACKHAUL',
  'LEAD_TIME',
  'OTD_RING_1',
  'AVG_DISTANCE_PER_TRIP',
  'TRIPS_PER_TRUCK_PER_WEEK',
  'TI',
  'TO',
  'AVERAGE_SCORE_CARD',
  'AVAILABILITY',
  'TOTAL_TRUCKS',
  'VIOLATION_RATE',
  'SKMD',
  'HRD',
];

const KPI_TYPE_TO_V2_KEY: Record<KpiType, string> = {
  DISPATCH_VOLUME: 'volumeMoved',
  GIGO: 'totalCico',
  CICO_CUSTOMER: 'totalCico',
  BACKHAUL: 'backhaulVolume',
  LEAD_TIME: 'averageDistancePerTrip',
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

const normalize = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toLowerCase();

export function toAggregatedMetricKey(kpiType: KpiType): string {
  return KPI_TYPE_TO_V2_KEY[kpiType] ?? kpiType.toLowerCase();
}

export function toHistoryKpiType(kpiType: KpiType): KpiType {
  return kpiType;
}

export function parseMetricTypeParam(metricTypeParam?: string | string[]): KpiType | null {
  const raw = Array.isArray(metricTypeParam) ? metricTypeParam[0] : metricTypeParam;
  if (!raw) return null;

  const exact = KPI_TYPES.find((item) => item === raw);
  if (exact) return exact;

  const normalizedRaw = normalize(raw);

  const byNormalizedKpi = KPI_TYPES.find((item) => normalize(item) === normalizedRaw);
  if (byNormalizedKpi) return byNormalizedKpi;

  const byAggregatedKey = KPI_TYPES.find(
    (item) => normalize(toAggregatedMetricKey(item)) === normalizedRaw,
  );
  if (byAggregatedKey) return byAggregatedKey;

  return null;
}

export function getAvailableKpiRouteMetrics(): KpiType[] {
  return [...KPI_TYPES];
}
