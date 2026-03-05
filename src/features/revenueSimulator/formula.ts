import {
  ALL_REVENUE_CONTROL_IDS,
  CONTROL_BOUND_CONFIG,
  FALLBACK_BASELINE_REVENUE,
  MIX_CONTROL_IDS,
  TAT_CONTROL_IDS,
} from '@/features/revenueSimulator/constants';
import {
  clampNumber,
  normalizeMixControls,
  roundTo,
  safeDivide,
} from '@/features/revenueSimulator/format';
import type {
  RevenueControlId,
  RevenueProjectionOutput,
  RevenueSimulatorBaseline,
  RevenueSimulatorControls,
} from '@/features/revenueSimulator/types';

const TAT_COMPOSITE_CONTROL_IDS = TAT_CONTROL_IDS.filter(
  (id) => id !== 'hosBlockedDriversImpact',
);
const HOURS_PER_WEEK = 168;
const OPERATING_DAYS_PER_MONTH = 30;
const DEFAULT_RATE_PER_TON_KM = 50;
const DEFAULT_CUSTOMER_CICO_FB = 18;
const DEFAULT_CUSTOMER_CICO_BULK = 25;
const DEFAULT_DISTANCE_SO = 320;
const DEFAULT_DISTANCE_STPO = 175;
const DEFAULT_DISTANCE_BULK = 470;

const getStepDecimals = (step: number): number => {
  if (step >= 1) return 0;
  const text = step.toString();
  if (!text.includes('.')) return 0;
  return text.split('.')[1].length;
};

const snapToStep = (value: number, step: number): number => {
  if (!Number.isFinite(step) || step <= 0) return value;
  const decimals = getStepDecimals(step);
  return roundTo(Math.round(value / step) * step, decimals);
};

export interface RevenueControlBounds {
  min: number;
  max: number;
  step: number;
}

export const resolveControlBounds = (
  controlId: RevenueControlId,
  baselineValue: number,
): RevenueControlBounds => {
  const config = CONTROL_BOUND_CONFIG[controlId];
  const baselineMagnitude = Math.max(Math.abs(baselineValue), 1);

  const min = config.absoluteMin ?? baselineMagnitude * config.minFactor;
  const max = config.absoluteMax ?? baselineMagnitude * config.maxFactor;

  return {
    min,
    max: max > min ? max : min + Math.max(config.step, 1),
    step: config.step,
  };
};

export const clampControlsToBounds = (
  controls: RevenueSimulatorControls,
  baselineControls: RevenueSimulatorControls,
): RevenueSimulatorControls => {
  const normalizedMix = normalizeMixControls(controls);
  const next: RevenueSimulatorControls = { ...normalizedMix };

  ALL_REVENUE_CONTROL_IDS.forEach((controlId) => {
    const bounds = resolveControlBounds(controlId, baselineControls[controlId]);
    const clamped = clampNumber(next[controlId], bounds.min, bounds.max);
    next[controlId] = snapToStep(clamped, bounds.step);
  });

  return normalizeMixControls(next);
};

export const calculateWeightedPayload = (controls: RevenueSimulatorControls): number => {
  return (
    controls.payloadSo * safeDivide(controls.soMix, 100, 0) +
    controls.payloadStpo * safeDivide(controls.stpoMix, 100, 0) +
    controls.payloadBulk * safeDivide(controls.bulkMix, 100, 0)
  );
};

export const calculateTatComposite = (controls: RevenueSimulatorControls): number => {
  const total = TAT_COMPOSITE_CONTROL_IDS.reduce((sum, controlId) => {
    return sum + controls[controlId];
  }, 0);
  return safeDivide(total, TAT_COMPOSITE_CONTROL_IDS.length, 0);
};

const calculateWeightedDistance = (
  controls: RevenueSimulatorControls,
  distanceCalibration = 1,
): number => {
  const totalMix = Math.max(controls.soMix + controls.stpoMix + controls.bulkMix, 1);
  const weightedMixDistance =
    (controls.soMix / totalMix) * DEFAULT_DISTANCE_SO +
    (controls.stpoMix / totalMix) * DEFAULT_DISTANCE_STPO +
    (controls.bulkMix / totalMix) * DEFAULT_DISTANCE_BULK;
  return Math.max(weightedMixDistance * distanceCalibration, 1);
};

interface SimulatorRevenueModel {
  monthlyRevenue: number;
  monthlyVolume: number;
  weeklyTripsPerTruckFb: number;
}

const calculateRevenueModel = (
  controls: RevenueSimulatorControls,
  ratePerTonKm: number,
  distanceCalibration: number,
): SimulatorRevenueModel => {
  const fbMixTotal = Math.max(controls.soMix + controls.stpoMix, 1);
  const soShare = controls.soMix / fbMixTotal;
  const stpoShare = controls.stpoMix / fbMixTotal;
  const avgPayloadFb = soShare * controls.payloadSo + stpoShare * controls.payloadStpo;

  // Approximate Zara's derived GIGO from plant turnaround components.
  const derivedGigo = Math.max(
    controls.gateInGateOut +
      controls.giyi +
      controls.yardInWeighIn +
      controls.wogo,
    0.1,
  );

  const totalTatFlatbed = Math.max(
    derivedGigo +
      controls.leadtimeFbIn +
      controls.leadtimeFbOut +
      controls.yardTimeFb +
      DEFAULT_CUSTOMER_CICO_FB,
    0.1,
  );
  const totalTatBulk = Math.max(
    derivedGigo +
      controls.leadtimeBulkIn +
      controls.leadtimeBulkOut +
      controls.yardTimeBulk +
      DEFAULT_CUSTOMER_CICO_BULK,
    0.1,
  );

  const weeklyTripsPerTruckFb = HOURS_PER_WEEK / totalTatFlatbed;
  const weeklyTripsPerTruckBulk = HOURS_PER_WEEK / totalTatBulk;

  const weeklyCapacityFb =
    Math.max(controls.flatbedTrucks, 0) * weeklyTripsPerTruckFb * Math.max(avgPayloadFb, 0);
  const weeklyCapacityBulk =
    Math.max(controls.bulkTrucks, 0) * weeklyTripsPerTruckBulk * Math.max(controls.payloadBulk, 0);
  const weeklyVolume = Math.max(weeklyCapacityFb + weeklyCapacityBulk, 0);
  const weeksPerMonth = OPERATING_DAYS_PER_MONTH / 7;
  const monthlyVolume = weeklyVolume * weeksPerMonth;

  const weightedDistance = calculateWeightedDistance(controls, distanceCalibration);
  const monthlyRevenue = Math.max(
    Math.max(ratePerTonKm, 0) * weeklyVolume * weightedDistance * weeksPerMonth,
    0,
  );

  return {
    monthlyRevenue,
    monthlyVolume,
    weeklyTripsPerTruckFb,
  };
};

const resolveStatus = (
  projectedRevenue: number,
  actualRevenue: number,
): Pick<RevenueProjectionOutput, 'statusLabel' | 'statusTone'> => {
  const ratio = safeDivide(projectedRevenue, Math.max(actualRevenue, 1), 0);
  if (ratio >= 1) return { statusLabel: 'On Track', statusTone: 'success' };
  if (ratio >= 0.9) return { statusLabel: 'Watch', statusTone: 'warning' };
  return { statusLabel: 'At Risk', statusTone: 'danger' };
};

export const computeRevenueProjection = (
  baseline: RevenueSimulatorBaseline,
  controls: RevenueSimulatorControls,
): RevenueProjectionOutput => {
  const boundedControls = clampControlsToBounds(controls, baseline.controls);
  const projectedMonthlyVolume = boundedControls.cementVolume + boundedControls.backhaulVolume;
  const weightedPayload = calculateWeightedPayload(boundedControls);
  const currentTatComposite = Math.max(calculateTatComposite(boundedControls), 0.0001);
  const currentTruckCount = boundedControls.flatbedTrucks + boundedControls.bulkTrucks;

  const volumeMultiplier = safeDivide(
    projectedMonthlyVolume,
    Math.max(baseline.baselineVolume, 1),
    1,
  );
  const payloadMultiplier = safeDivide(
    weightedPayload,
    Math.max(baseline.baselineWeightedPayload, 1),
    1,
  );
  const fleetMultiplier = Math.sqrt(
    safeDivide(currentTruckCount, Math.max(baseline.baselineAvailableTrucks, 1), 1),
  );
  const tatMultiplier = clampNumber(
    safeDivide(Math.max(baseline.baselineTatComposite, 1), currentTatComposite, 1),
    0.75,
    1.35,
  );
  const hosMultiplier = clampNumber(
    1 - (boundedControls.hosBlockedDriversImpact - baseline.baselineHos) * 0.01,
    0.7,
    1.1,
  );

  const stpoMixDelta = boundedControls.stpoMix - baseline.controls.stpoMix;
  const bulkMixDelta = boundedControls.bulkMix - baseline.controls.bulkMix;
  const mixEfficiencyMultiplier = 1 + stpoMixDelta * 0.0015 - bulkMixDelta * 0.001;

  const baselineMixDistance = calculateWeightedDistance(baseline.controls, 1);
  const distanceCalibration =
    baseline.baselineAvgDistance > 0
      ? baseline.baselineAvgDistance / Math.max(baselineMixDistance, 1)
      : 1;
  const ratePerTonKm =
    baseline.baselineFreightCostPerTon > 0 && baseline.baselineAvgDistance > 0
      ? baseline.baselineFreightCostPerTon / baseline.baselineAvgDistance
      : DEFAULT_RATE_PER_TON_KM;

  const actualModel = calculateRevenueModel(
    baseline.controls,
    ratePerTonKm,
    distanceCalibration,
  );
  const projectedModel = calculateRevenueModel(
    boundedControls,
    ratePerTonKm,
    distanceCalibration,
  );

  const inferredBaselineRevenue = baseline.baselineVolume * baseline.baselineFreightCostPerTon;
  const actualRevenue = Math.max(
    baseline.baselineRevenue > 0
      ? baseline.baselineRevenue
      : actualModel.monthlyRevenue > 0
        ? actualModel.monthlyRevenue
        : inferredBaselineRevenue > 0
        ? inferredBaselineRevenue
        : FALLBACK_BASELINE_REVENUE,
    0,
  );
  const projectedRevenue = Math.max(
    projectedModel.monthlyRevenue > 0
      ? projectedModel.monthlyRevenue
      : actualRevenue *
          volumeMultiplier *
          payloadMultiplier *
          fleetMultiplier *
          tatMultiplier *
          hosMultiplier *
          mixEfficiencyMultiplier,
    0,
  );

  const projectedTripsPerTruckWeek = projectedModel.weeklyTripsPerTruckFb;
  const denominator = Math.max(weightedPayload * projectedTripsPerTruckWeek * 4.33, 1);
  const trucksNeeded = Math.max(Math.ceil(projectedMonthlyVolume / denominator), 0);
  const availableTrucks = Math.max(Math.round(currentTruckCount), 0);
  const utilizationPct =
    availableTrucks > 0 ? safeDivide(trucksNeeded, availableTrucks, 0) * 100 : 0;

  const fleetCapacityTarget = Math.max(baseline.baselineVolume * 1.1, 1);
  const fleetCapacityProgress = safeDivide(projectedMonthlyVolume, fleetCapacityTarget, 0);

  const mixDistanceAdjustment = clampNumber(
    1 + ((bulkMixDelta - stpoMixDelta) * 0.001),
    0.9,
    1.1,
  );
  const avgDistance = baseline.baselineAvgDistance * mixDistanceAdjustment;

  const status = resolveStatus(projectedRevenue, actualRevenue);

  const customerCicoFb = safeDivide(
    boundedControls.leadtimeFbIn +
      boundedControls.leadtimeFbOut +
      boundedControls.yardTimeFb,
    3,
    0,
  );
  const customerCicoBulk = safeDivide(
    boundedControls.leadtimeBulkIn +
      boundedControls.leadtimeBulkOut +
      boundedControls.yardTimeBulk,
    3,
    0,
  );
  const depotCico = safeDivide(
    boundedControls.gateInGateOut +
      boundedControls.giyi +
      boundedControls.yardInWeighIn +
      boundedControls.wogo,
    4,
    0,
  );

  return {
    controls: boundedControls,
    actualRevenue,
    projectedRevenue,
    projectedMonthlyVolume,
    weightedPayload,
    projectedTripsPerTruckWeek,
    trucksNeeded,
    availableTrucks,
    utilizationPct,
    fleetCapacityTarget,
    fleetCapacityProgress,
    avgDistance,
    statusLabel: status.statusLabel,
    statusTone: status.statusTone,
    multipliers: {
      volumeMultiplier,
      payloadMultiplier,
      fleetMultiplier,
      tatMultiplier,
      hosMultiplier,
      mixEfficiencyMultiplier,
    },
    footerKpis: {
      customerCicoFb: roundTo(customerCicoFb, 1),
      customerCicoBulk: roundTo(customerCicoBulk, 1),
      depotCico: roundTo(depotCico, 1),
    },
  };
};

export const applyScenario = (
  scenarioId: 'add_trucks' | 'cut_tat_10' | 'boost_volume_10',
  controls: RevenueSimulatorControls,
): RevenueSimulatorControls => {
  if (scenarioId === 'add_trucks') {
    return { ...controls, flatbedTrucks: controls.flatbedTrucks + 10 };
  }

  if (scenarioId === 'boost_volume_10') {
    return {
      ...controls,
      cementVolume: controls.cementVolume * 1.1,
      backhaulVolume: controls.backhaulVolume * 1.1,
    };
  }

  const tatReduced: RevenueSimulatorControls = { ...controls };
  TAT_COMPOSITE_CONTROL_IDS.forEach((controlId) => {
    tatReduced[controlId] = tatReduced[controlId] * 0.9;
  });
  return tatReduced;
};

export const isMixControl = (controlId: RevenueControlId): boolean => {
  return MIX_CONTROL_IDS.includes(controlId as (typeof MIX_CONTROL_IDS)[number]);
};
