import {
  FALLBACK_BASELINE_AVG_DISTANCE,
  FALLBACK_BASELINE_FREIGHT_COST_PER_TON,
  FALLBACK_BASELINE_REVENUE,
  FALLBACK_BASELINE_TRIPS_PER_TRUCK,
  FALLBACK_CONTROL_VALUES,
} from '@/features/revenueSimulator/constants';
import {
  calculateTatComposite,
  calculateWeightedPayload,
} from '@/features/revenueSimulator/formula';
import type {
  RevenueControlId,
  RevenueSimulatorBaseline,
  RevenueSimulatorControls,
} from '@/features/revenueSimulator/types';
import type { KpiMetricDetail, KpiV2AggregatedResult } from '@/types/api';

interface MetricReadResult {
  value: number | null;
  fromApi: boolean;
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const trimmed = value.trim();
    const direct = Number(trimmed.replace(/,/g, ''));
    if (Number.isFinite(direct)) return direct;

    const sanitized = trimmed.replace(/[^0-9.-]/g, '');
    if (!sanitized) return null;
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toPositiveMagnitude = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const magnitude = Math.abs(value);
  return magnitude > 0 ? magnitude : null;
};

const readMetric = (
  metrics: Record<string, KpiMetricDetail>,
  key: string,
): MetricReadResult => {
  const metric = metrics[key];
  if (!metric) return { value: null, fromApi: false };
  const value = toNumber(
    metric.actual ??
      (metric as unknown as { metricValue?: unknown }).metricValue ??
      (metric as unknown as { value?: unknown }).value ??
      (metric as unknown as { score?: unknown }).score,
  );
  if (value === null) return { value: null, fromApi: false };
  return { value, fromApi: true };
};

const markEstimated = (
  estimatedControlIds: Set<RevenueControlId>,
  controlIds: RevenueControlId[],
) => {
  controlIds.forEach((id) => estimatedControlIds.add(id));
};

export const mapAggregatedToBaseline = (
  payload: KpiV2AggregatedResult,
): RevenueSimulatorBaseline => {
  const metrics = payload?.kpiMetrics ?? {};
  const estimatedControlIds = new Set<RevenueControlId>();

  const volumeMoved = readMetric(metrics, 'volumeMoved');
  const backhaulVolume = readMetric(metrics, 'backhaulVolume');
  const totalTrucks = readMetric(metrics, 'totalTrucks');
  const averagePayload = readMetric(metrics, 'averagePayload');
  const totalCico = readMetric(metrics, 'totalCico');
  const ti = readMetric(metrics, 'ti');
  const to = readMetric(metrics, 'to');
  const hrd = readMetric(metrics, 'hrd');
  const highRiskDrivers = readMetric(metrics, 'highRiskDrivers');

  const cementVolumeValue =
    volumeMoved.value ?? FALLBACK_CONTROL_VALUES.cementVolume;
  if (!volumeMoved.fromApi) {
    markEstimated(estimatedControlIds, ['cementVolume']);
  }

  const backhaulVolumeValue =
    backhaulVolume.value ?? FALLBACK_CONTROL_VALUES.backhaulVolume;
  if (!backhaulVolume.fromApi) {
    markEstimated(estimatedControlIds, ['backhaulVolume']);
  }

  const totalTruckCount =
    totalTrucks.value ??
    FALLBACK_CONTROL_VALUES.flatbedTrucks + FALLBACK_CONTROL_VALUES.bulkTrucks;
  if (!totalTrucks.fromApi) {
    markEstimated(estimatedControlIds, ['flatbedTrucks', 'bulkTrucks']);
  }

  const avgPayloadValue = averagePayload.value ?? FALLBACK_CONTROL_VALUES.payloadBulk;
  if (!averagePayload.fromApi) {
    markEstimated(estimatedControlIds, ['payloadSo', 'payloadStpo', 'payloadBulk']);
  }

  const totalCicoValue =
    totalCico.value ??
    FALLBACK_CONTROL_VALUES.gateInGateOut +
      FALLBACK_CONTROL_VALUES.giyi +
      FALLBACK_CONTROL_VALUES.yardInWeighIn +
      FALLBACK_CONTROL_VALUES.wogo;
  if (!totalCico.fromApi) {
    markEstimated(estimatedControlIds, [
      'gateInGateOut',
      'giyi',
      'yardInWeighIn',
      'wogo',
      'yardTimeFb',
      'yardTimeBulk',
    ]);
  }

  const leadtimeFbInValue = ti.value ?? FALLBACK_CONTROL_VALUES.leadtimeFbIn;
  if (!ti.fromApi) {
    markEstimated(estimatedControlIds, ['leadtimeFbIn', 'leadtimeBulkIn']);
  }

  const leadtimeFbOutValue = to.value ?? FALLBACK_CONTROL_VALUES.leadtimeFbOut;
  if (!to.fromApi) {
    markEstimated(estimatedControlIds, ['leadtimeFbOut', 'leadtimeBulkOut']);
  }

  const hrdSource = hrd.value ?? highRiskDrivers.value;
  const hosValue = hrdSource ?? FALLBACK_CONTROL_VALUES.hosBlockedDriversImpact;
  if (hrdSource === null) {
    markEstimated(estimatedControlIds, ['hosBlockedDriversImpact']);
  }

  // Mix values are simulated-only in v1.
  markEstimated(estimatedControlIds, ['soMix', 'stpoMix', 'bulkMix']);

  const controls: RevenueSimulatorControls = {
    cementVolume: Math.max(0, cementVolumeValue),
    backhaulVolume: Math.max(0, backhaulVolumeValue),
    soMix: FALLBACK_CONTROL_VALUES.soMix,
    stpoMix: FALLBACK_CONTROL_VALUES.stpoMix,
    bulkMix: FALLBACK_CONTROL_VALUES.bulkMix,
    flatbedTrucks: Math.max(0, totalTruckCount * 0.78),
    bulkTrucks: Math.max(0, totalTruckCount * 0.22),
    payloadSo: Math.max(0, avgPayloadValue * 0.9),
    payloadStpo: Math.max(0, avgPayloadValue * 1.05),
    payloadBulk: Math.max(0, avgPayloadValue),
    gateInGateOut: Math.max(0, totalCicoValue * 0.45),
    giyi: Math.max(0, totalCicoValue * 0.2),
    yardInWeighIn: Math.max(0, totalCicoValue * 0.15),
    wogo: Math.max(0, totalCicoValue * 0.2),
    leadtimeFbIn: Math.max(0, leadtimeFbInValue),
    leadtimeFbOut: Math.max(0, leadtimeFbOutValue),
    yardTimeFb: Math.max(0, totalCicoValue * 0.35),
    leadtimeBulkIn: Math.max(0, leadtimeFbInValue * 1.9),
    leadtimeBulkOut: Math.max(0, leadtimeFbOutValue * 1.9),
    yardTimeBulk: Math.max(0, totalCicoValue * 0.35 * 0.67),
    hosBlockedDriversImpact: Math.max(0, hosValue),
  };

  const baselineVolume = controls.cementVolume + controls.backhaulVolume;
  const baselineWeightedPayload = calculateWeightedPayload(controls);
  const baselineTatComposite = calculateTatComposite(controls);

  const tripsPerTruck = readMetric(metrics, 'tripsPerTruck');
  const averageDistance = readMetric(metrics, 'averageDistance');
  const freightCostPerTon = readMetric(metrics, 'freightCostPerTon');
  const totalFreightCost = readMetric(metrics, 'totalFreightCost');

  if (!tripsPerTruck.fromApi) {
    markEstimated(estimatedControlIds, ['flatbedTrucks', 'bulkTrucks']);
  }

  const baselineTripsPerTruck =
    tripsPerTruck.value ?? FALLBACK_BASELINE_TRIPS_PER_TRUCK;
  const baselineAvgDistance =
    averageDistance.value ?? FALLBACK_BASELINE_AVG_DISTANCE;
  const positiveVolumeMoved = toPositiveMagnitude(volumeMoved.value);
  const positiveBaselineVolume = toPositiveMagnitude(baselineVolume);
  const positiveFreightCostPerTon = toPositiveMagnitude(freightCostPerTon.value);
  const positiveTotalFreightCost = toPositiveMagnitude(totalFreightCost.value);

  const derivedFreightCostPerTon =
    positiveFreightCostPerTon ??
    (positiveTotalFreightCost !== null && positiveBaselineVolume !== null
      ? positiveTotalFreightCost / positiveBaselineVolume
      : null);

  const baselineFreightCostPerTon =
    derivedFreightCostPerTon ?? FALLBACK_BASELINE_FREIGHT_COST_PER_TON;

  const computedRevenueFromRate =
    positiveBaselineVolume !== null && derivedFreightCostPerTon !== null
      ? positiveBaselineVolume * derivedFreightCostPerTon
      : null;

  const baselineRevenue =
    positiveTotalFreightCost ?? computedRevenueFromRate ?? FALLBACK_BASELINE_REVENUE;

  const hasValidRevenueFromApi = totalFreightCost.fromApi && positiveTotalFreightCost !== null;
  const hasValidVolumeAndRateFromApi =
    volumeMoved.fromApi &&
    freightCostPerTon.fromApi &&
    positiveVolumeMoved !== null &&
    positiveFreightCostPerTon !== null;
  const criticalFallbackUsed = !(hasValidRevenueFromApi || hasValidVolumeAndRateFromApi);

  return {
    controls,
    baselineRevenue,
    baselineVolume,
    baselineWeightedPayload,
    baselineTatComposite,
    baselineHos: controls.hosBlockedDriversImpact,
    baselineTripsPerTruck,
    baselineAvailableTrucks: controls.flatbedTrucks + controls.bulkTrucks,
    baselineAvgDistance,
    baselineFreightCostPerTon,
    criticalFallbackUsed,
    estimatedControlIds: Array.from(estimatedControlIds),
  };
};
