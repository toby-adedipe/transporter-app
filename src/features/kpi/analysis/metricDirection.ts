export type KpiMetricDirection = 'higher_is_better' | 'lower_is_better';
export type KpiMetricFamily =
  | 'delivery'
  | 'safety'
  | 'turnaround'
  | 'utilization'
  | 'cost'
  | 'productivity';

const LOWER_IS_BETTER_KEYS = new Set([
  'ti',
  'to',
  'totalTimeIn',
  'totalTimeOut',
  'averageDistancePerTrip',
  'violationRate',
  'highRiskDrivers',
  'hrd',
  'fatalIncidents',
  'totalFreightCost',
  'freightCostPerTon',
  'redDrivers',
  'rta',
]);

const METRIC_FAMILY_MAP: Record<string, KpiMetricFamily> = {
  otd: 'delivery',
  otdCount: 'delivery',
  volumeMoved: 'delivery',
  totalTrips: 'delivery',
  backhaulVolume: 'delivery',
  backhaulCount: 'delivery',
  totalCico: 'delivery',
  timeInCount: 'delivery',
  timeOutCount: 'delivery',

  skmd: 'safety',
  violationRate: 'safety',
  hrd: 'safety',
  highRiskDrivers: 'safety',
  fatalIncidents: 'safety',
  totalSafetyScore: 'safety',
  redDrivers: 'safety',
  greenDriversKm: 'safety',
  rta: 'safety',

  ti: 'turnaround',
  to: 'turnaround',
  totalTimeIn: 'turnaround',
  totalTimeOut: 'turnaround',
  averageDistancePerTrip: 'turnaround',
  averageDistance: 'turnaround',

  availability: 'utilization',
  totalTrucks: 'utilization',
  tripsPerTruck: 'utilization',
  payloadCount: 'utilization',

  totalFreightCost: 'cost',
  freightCostPerTon: 'cost',

  averagePayload: 'productivity',
  totalPayload: 'productivity',
  totalDistance: 'productivity',
  totalDrivers: 'productivity',
  averageScoreCard: 'productivity',
};

export function getMetricDirection(metricKey: string): KpiMetricDirection {
  return LOWER_IS_BETTER_KEYS.has(metricKey) ? 'lower_is_better' : 'higher_is_better';
}

export function getMetricFamily(metricKey: string): KpiMetricFamily {
  return METRIC_FAMILY_MAP[metricKey] ?? 'productivity';
}
