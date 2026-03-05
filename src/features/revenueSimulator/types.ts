import type { KpiV2AggregatedResult } from '@/types/api';

export type RevenueControlId =
  | 'cementVolume'
  | 'backhaulVolume'
  | 'soMix'
  | 'stpoMix'
  | 'bulkMix'
  | 'flatbedTrucks'
  | 'bulkTrucks'
  | 'payloadSo'
  | 'payloadStpo'
  | 'payloadBulk'
  | 'gateInGateOut'
  | 'giyi'
  | 'yardInWeighIn'
  | 'wogo'
  | 'leadtimeFbIn'
  | 'leadtimeFbOut'
  | 'yardTimeFb'
  | 'leadtimeBulkIn'
  | 'leadtimeBulkOut'
  | 'yardTimeBulk'
  | 'hosBlockedDriversImpact';

export type MixControlId = 'soMix' | 'stpoMix' | 'bulkMix';

export type RevenueSimulatorSectionId =
  | 'volume'
  | 'payload'
  | 'fleet'
  | 'tatPlant'
  | 'tatJourney';

export interface RevenueSimulatorControls {
  cementVolume: number;
  backhaulVolume: number;
  soMix: number;
  stpoMix: number;
  bulkMix: number;
  flatbedTrucks: number;
  bulkTrucks: number;
  payloadSo: number;
  payloadStpo: number;
  payloadBulk: number;
  gateInGateOut: number;
  giyi: number;
  yardInWeighIn: number;
  wogo: number;
  leadtimeFbIn: number;
  leadtimeFbOut: number;
  yardTimeFb: number;
  leadtimeBulkIn: number;
  leadtimeBulkOut: number;
  yardTimeBulk: number;
  hosBlockedDriversImpact: number;
}

export interface RevenueSimulatorControlDefinition {
  id: RevenueControlId;
  label: string;
  unit: string;
  sectionId: RevenueSimulatorSectionId;
  decimals: number;
}

export interface RevenueSimulatorSectionDefinition {
  id: RevenueSimulatorSectionId;
  title: string;
  controlIds: RevenueControlId[];
}

export interface RevenueSimulatorQuickScenario {
  id: 'add_trucks' | 'cut_tat_10' | 'boost_volume_10';
  label: string;
  icon: string;
}

export interface RevenueSimulatorBaseline {
  controls: RevenueSimulatorControls;
  baselineRevenue: number;
  baselineVolume: number;
  baselineWeightedPayload: number;
  baselineTatComposite: number;
  baselineHos: number;
  baselineTripsPerTruck: number;
  baselineAvailableTrucks: number;
  baselineAvgDistance: number;
  baselineFreightCostPerTon: number;
  criticalFallbackUsed: boolean;
  estimatedControlIds: RevenueControlId[];
}

export interface RevenueProjectionMultipliers {
  volumeMultiplier: number;
  payloadMultiplier: number;
  fleetMultiplier: number;
  tatMultiplier: number;
  hosMultiplier: number;
  mixEfficiencyMultiplier: number;
}

export interface RevenueProjectionFooterKpis {
  customerCicoFb: number;
  customerCicoBulk: number;
  depotCico: number;
}

export interface RevenueProjectionOutput {
  controls: RevenueSimulatorControls;
  actualRevenue: number;
  projectedRevenue: number;
  projectedMonthlyVolume: number;
  weightedPayload: number;
  projectedTripsPerTruckWeek: number;
  trucksNeeded: number;
  availableTrucks: number;
  utilizationPct: number;
  fleetCapacityTarget: number;
  fleetCapacityProgress: number;
  avgDistance: number;
  statusLabel: 'On Track' | 'Watch' | 'At Risk';
  statusTone: 'success' | 'warning' | 'danger';
  multipliers: RevenueProjectionMultipliers;
  footerKpis: RevenueProjectionFooterKpis;
}

export interface RevenueSimulatorMappedResult {
  baseline: RevenueSimulatorBaseline;
  payload: KpiV2AggregatedResult;
}
